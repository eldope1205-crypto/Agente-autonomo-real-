import { URL } from 'url';
import { Database } from '../../db/database.js';

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  sanitizedUrl?: string;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Validates URLs against SSRF, dangerous protocols, private IPs and loopbacks.
   */
  public validateUrl(rawUrl: string): ValidationResult {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { allowed: false, reason: 'URL vacía o no válida.' };
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      return { allowed: false, reason: 'Formato de URL no parseable.' };
    }

    // Protocol check: only http and https allowed
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      this.recordBlock('ssrf-protection', `Protocolo inseguro rechazado: ${parsed.protocol}`);
      return { allowed: false, reason: `Protocolo no permitido: ${parsed.protocol}. Solo HTTP/HTTPS.` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Localhost checks
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      this.recordBlock('ssrf-protection', `Intento de acceso a localhost detectado: ${hostname}`);
      return { allowed: false, reason: 'Acceso a loopback / localhost denegado por seguridad.' };
    }

    // Cloud metadata services check
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      this.recordBlock('ssrf-protection', `Intento de acceso a metadatos de nube bloqueado: ${hostname}`);
      return { allowed: false, reason: 'Acceso a metadatos de infraestructura bloqueado.' };
    }

    // IPv4 private ranges (RFC1918)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      // 10.0.0.0 - 10.255.255.255
      if (octet1 === 10) {
        this.recordBlock('ssrf-protection', `IP Privada 10.x bloqueada: ${hostname}`);
        return { allowed: false, reason: 'Rango de red privada (10.0.0.0/8) bloqueado.' };
      }
      // 172.16.0.0 - 172.31.255.255
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
        this.recordBlock('ssrf-protection', `IP Privada 172.16-31.x bloqueada: ${hostname}`);
        return { allowed: false, reason: 'Rango de red privada (172.16.0.0/12) bloqueado.' };
      }
      // 192.168.0.0 - 192.168.255.255
      if (octet1 === 192 && octet2 === 168) {
        this.recordBlock('ssrf-protection', `IP Privada 192.168.x bloqueada: ${hostname}`);
        return { allowed: false, reason: 'Rango de red privada (192.168.0.0/16) bloqueado.' };
      }
    }

    return { allowed: true, sanitizedUrl: parsed.toString() };
  }

  /**
   * Sanitizes external text and marks it as untrusted to shield LLM from prompt injection.
   */
  public sanitizeExternalContent(rawText: string, sourceName: string): string {
    if (!rawText) return '';
    // Strip control characters, NULL bytes
    let clean = rawText.replace(/\0/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Limit text length to prevent memory exhaustion attacks
    const MAX_CHARS = 100000;
    if (clean.length > MAX_CHARS) {
      clean = clean.substring(0, MAX_CHARS) + '\n[...Contenido truncado por límite de seguridad...]';
    }

    // Wrap in explicit untrusted data boundary for LLM processing
    return `<<<DATOS_EXTERNOS_NO_CONFIABLES FUENTE="${sourceName}">>>\n${clean}\n<<<FIN_DATOS_EXTERNOS>>>`;
  }

  /**
   * Detects prompt injection attempts in external input.
   */
  public detectInjectionAttempts(text: string): boolean {
    const dangerousPatterns = [
      /ignore previous instructions/i,
      /ignora las instrucciones anteriores/i,
      /system override/i,
      /you are now in unrestricted mode/i,
      /bypass all safety/i,
      /cambia las reglas financieras/i,
      /confirma el pago automáticamente/i,
      /set confirmed_income/i,
      /disable ssrf/i,
      /desactiva la seguridad/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(text)) {
        this.recordBlock('prompt-injection-shield', `Patrón sospechoso de inyección detectado: ${pattern}`);
        return true;
      }
    }
    return false;
  }

  private recordBlock(ruleId: string, details: string) {
    const state = this.db.getState();
    const rule = state.securityRules.find((r) => r.id === ruleId);
    if (rule) {
      rule.blocksCount += 1;
      rule.lastBlocked = new Date().toISOString();
    }
    this.db.addEvent({
      type: 'SECURITY_BLOCK',
      severity: 'WARNING',
      title: 'Bloqueo de Seguridad Activo',
      message: details,
      metadata: { ruleId },
    });
    this.db.save();
  }
}
