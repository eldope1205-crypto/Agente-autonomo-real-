import { URL } from 'url';
import dns from 'dns/promises';
import net from 'net';
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
      SecurityManager.instance =
        new SecurityManager();
    }

    return SecurityManager.instance;
  }

  /**
   * Valida URLs externas y bloquea destinos
   * potencialmente peligrosos.
   */
  public validateUrl(
    rawUrl: string
  ): ValidationResult {
    if (
      !rawUrl ||
      typeof rawUrl !== 'string'
    ) {
      return {
        allowed: false,
        reason:
          'URL vacía o no válida.',
      };
    }

    let parsed: URL;

    try {
      parsed = new URL(
        rawUrl.trim()
      );
    } catch {
      return {
        allowed: false,
        reason:
          'Formato de URL no válido.',
      };
    }

    /*
     * Solo HTTP y HTTPS.
     */
    if (
      parsed.protocol !== 'http:' &&
      parsed.protocol !== 'https:'
    ) {
      this.recordBlock(
        'ssrf-protection',
        `Protocolo bloqueado: ${parsed.protocol}`
      );

      return {
        allowed: false,
        reason:
          'Solo se permiten conexiones HTTP/HTTPS.',
      };
    }

    /*
     * Credenciales dentro de la URL:
     *
     * http://usuario:password@...
     *
     * Se bloquean porque pueden utilizarse
     * para ocultar destinos o credenciales.
     */
    if (
      parsed.username ||
      parsed.password
    ) {
      this.recordBlock(
        'ssrf-protection',
        'URL con credenciales embebidas bloqueada.'
      );

      return {
        allowed: false,
        reason:
          'Las URLs con usuario o contraseña embebidos no están permitidas.',
      };
    }

    const hostname =
      parsed.hostname
        .toLowerCase()
        .replace(/\.$/, '');

    /*
     * Hostnames locales.
     */
    const blockedHostnames = [
      'localhost',
      'localhost.localdomain',
      'ip6-localhost',
      'ip6-loopback',
      'broadcasthost',
      'metadata.google.internal',
      'metadata',
    ];

    if (
      blockedHostnames.includes(
        hostname
      ) ||
      hostname.endsWith(
        '.localhost'
      ) ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      this.recordBlock(
        'ssrf-protection',
        `Destino local bloqueado: ${hostname}`
      );

      return {
        allowed: false,
        reason:
          'Acceso a destinos locales o internos bloqueado.',
      };
    }

    /*
     * IP directa.
     */
    if (net.isIP(hostname)) {
      if (
        this.isPrivateIp(hostname)
      ) {
        this.recordBlock(
          'ssrf-protection',
          `IP privada o reservada bloqueada: ${hostname}`
        );

        return {
          allowed: false,
          reason:
            'La IP pertenece a una red privada, local o reservada.',
        };
      }
    }

    /*
     * Bloqueamos puertos poco habituales
     * para reducir superficies de ataque.
     *
     * HTTP/HTTPS normales:
     * 80 / 443
     */
    if (
      parsed.port &&
      parsed.port !== '80' &&
      parsed.port !== '443'
    ) {
      this.recordBlock(
        'ssrf-protection',
        `Puerto externo no permitido: ${parsed.port}`
      );

      return {
        allowed: false,
        reason:
          'Solo se permiten puertos HTTP/HTTPS estándar.',
      };
    }

    /*
     * El agente no permite javascript:
     * ni otros esquemas disfrazados.
     */
    if (
      parsed.href
        .toLowerCase()
        .startsWith(
          'javascript:'
        )
    ) {
      this.recordBlock(
        'input-validation',
        'Esquema javascript bloqueado.'
      );

      return {
        allowed: false,
        reason:
          'Esquema no permitido.',
      };
    }

    /*
     * Reconstruimos la URL limpia.
     */
    parsed.username = '';
    parsed.password = '';

    return {
      allowed: true,
      sanitizedUrl:
        parsed.toString(),
    };
  }

  /**
   * Comprueba IPs privadas, locales,
   * reservadas y de infraestructura.
   */
  private isPrivateIp(
    ip: string
  ): boolean {
    /*
     * IPv4
     */
    if (
      net.isIP(ip) === 4
    ) {
      const parts =
        ip
          .split('.')
          .map(Number);

      if (parts.length !== 4) {
        return true;
      }

      const [
        a,
        b,
        c,
        d,
      ] = parts;

      if (
        parts.some(
          (value) =>
            !Number.isInteger(
              value
            ) ||
            value < 0 ||
            value > 255
        )
      ) {
        return true;
      }

      /*
       * 0.0.0.0/8
       */
      if (a === 0) {
        return true;
      }

      /*
       * 10.0.0.0/8
       */
      if (a === 10) {
        return true;
      }

      /*
       * 100.64.0.0/10
       * Carrier-grade NAT.
       */
      if (
        a === 100 &&
        b >= 64 &&
        b <= 127
      ) {
        return true;
      }

      /*
       * 127.0.0.0/8
       */
      if (a === 127) {
        return true;
      }

      /*
       * 169.254.0.0/16
       * Link-local / cloud metadata.
       */
      if (
        a === 169 &&
        b === 254
      ) {
        return true;
      }

      /*
       * 172.16.0.0/12
       */
      if (
        a === 172 &&
        b >= 16 &&
        b <= 31
      ) {
        return true;
      }

      /*
       * 192.0.0.0/24
       */
      if (
        a === 192 &&
        b === 0 &&
        c === 0
      ) {
        return true;
      }

      /*
       * 192.0.2.0/24
       * TEST-NET.
       */
      if (
        a === 192 &&
        b === 0 &&
        c === 2
      ) {
        return true;
      }

      /*
       * 192.168.0.0/16
       */
      if (
        a === 192 &&
        b === 168
      ) {
        return true;
      }

      /*
       * 198.18.0.0/15
       * Benchmark/testing.
       */
      if (
        a === 198 &&
        (b === 18 ||
          b === 19)
      ) {
        return true;
      }

      /*
       * 198.51.100.0/24
       * TEST-NET.
       */
      if (
        a === 198 &&
        b === 51 &&
        c === 100
      ) {
        return true;
      }

      /*
       * 203.0.113.0/24
       * TEST-NET.
       */
      if (
        a === 203 &&
        b === 0 &&
        c === 113
      ) {
        return true;
      }

      /*
       * 224.0.0.0/4
       * Multicast.
       */
      if (a >= 224) {
        return true;
      }

      /*
       * 255.255.255.255
       */
      if (
        a === 255 &&
        b === 255 &&
        c === 255 &&
        d === 255
      ) {
        return true;
      }

      return false;
    }

    /*
     * IPv6.
     */
    if (
      net.isIP(ip) === 6
    ) {
      const normalized =
        ip.toLowerCase();

      /*
       * ::1
       */
      if (
        normalized === '::1'
      ) {
        return true;
      }

      /*
       * IPv4-mapped IPv6.
       */
      if (
        normalized.includes(
          '::ffff:'
        )
      ) {
        const mapped =
          normalized.split(
            '::ffff:'
          )[1];

        if (
          net.isIP(mapped) === 4
        ) {
          return this.isPrivateIp(
            mapped
          );
        }
      }

      /*
       * fc00::/7
       * Unique local.
       */
      if (
        normalized.startsWith(
          'fc'
        ) ||
        normalized.startsWith(
          'fd'
        )
      ) {
        return true;
      }

      /*
       * fe80::/10
       * Link local.
       */
      if (
        normalized.startsWith(
          'fe8'
        ) ||
        normalized.startsWith(
          'fe9'
        ) ||
        normalized.startsWith(
          'fea'
        ) ||
        normalized.startsWith(
          'feb'
        )
      ) {
        return true;
      }

      return false;
    }

    return true;
  }

  /**
   * Comprueba el destino DNS antes de realizar
   * una petición.
   *
   * Esto ayuda contra SSRF mediante dominios
   * que resuelven a IPs privadas.
   */
  public async validateResolvedHost(
    hostname: string
  ): Promise<ValidationResult> {
    if (
      !hostname ||
      typeof hostname !== 'string'
    ) {
      return {
        allowed: false,
        reason:
          'Hostname no válido.',
      };
    }

    const cleanHostname =
      hostname
        .toLowerCase()
        .replace(/\.$/, '');

    if (
      net.isIP(
        cleanHostname
      )
    ) {
      if (
        this.isPrivateIp(
          cleanHostname
        )
      ) {
        return {
          allowed: false,
          reason:
            'El destino resuelve a una IP privada o reservada.',
        };
      }

      return {
        allowed: true,
      };
    }

    try {
      const addresses =
        await dns.lookup(
          cleanHostname,
          {
            all: true,
          }
        );

      for (
        const address of addresses
      ) {
        if (
          this.isPrivateIp(
            address.address
          )
        ) {
          this.recordBlock(
            'ssrf-protection',
            `DNS resuelto a IP privada: ${cleanHostname} -> ${address.address}`
          );

          return {
            allowed: false,
            reason:
              'El dominio resuelve a una IP privada o reservada.',
          };
        }
      }

      return {
        allowed: true,
      };
    } catch {
      return {
        allowed: false,
        reason:
          'No se pudo resolver el dominio.',
      };
    }
  }

  /**
   * Limpia contenido externo antes de entregárselo
   * a cualquier módulo de análisis.
   */
  public sanitizeExternalContent(
    rawText: string,
    sourceName: string
  ): string {
    if (!rawText) {
      return '';
    }

    let clean =
      String(rawText)
        .replace(/\0/g, '')
        .replace(
          /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
          ''
        );

    const MAX_CHARS =
      100000;

    if (
      clean.length >
      MAX_CHARS
    ) {
      clean =
        clean.substring(
          0,
          MAX_CHARS
        ) +
        '\n[CONTENIDO TRUNCADO POR SEGURIDAD]';
    }

    const safeSource =
      String(sourceName)
        .replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        )
        .substring(
          0,
          100
        );

    return (
      `<<<DATOS_EXTERNOS_NO_CONFIABLES FUENTE="${safeSource}">>>\n` +
      clean +
      '\n<<<FIN_DATOS_EXTERNOS>>>'
    );
  }

  /**
   * Detecta intentos habituales de prompt injection.
   */
  public detectInjectionAttempts(
    text: string
  ): boolean {
    if (!text) {
      return false;
    }

    const dangerousPatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /ignora\s+(todas\s+)?las\s+instrucciones/i,
      /system\s+override/i,
      /developer\s+message/i,
      /you\s+are\s+now\s+in\s+unrestricted\s+mode/i,
      /bypass\s+(all\s+)?safety/i,
      /disable\s+(all\s+)?security/i,
      /desactiva\s+(toda\s+)?la\s+seguridad/i,
      /cambia\s+las\s+reglas\s+financieras/i,
      /confirma\s+el\s+pago\s+automáticamente/i,
      /confirm\s+the\s+payment\s+automatically/i,
      /set\s+confirmed_income/i,
      /set\s+confirmedincome/i,
      /disable\s+ssrf/i,
      /desactiva\s+ssrf/i,
      /reveal\s+system\s+prompt/i,
      /revela\s+el\s+prompt\s+del\s+sistema/i,
    ];

    for (
      const pattern of
      dangerousPatterns
    ) {
      if (
        pattern.test(text)
      ) {
        this.recordBlock(
          'prompt-injection-shield',
          `Patrón sospechoso detectado: ${pattern}`
        );

        return true;
      }
    }

    return false;
  }

  /**
   * Valida contenido recibido de una fuente
   * antes de utilizarlo.
   */
  public validateExternalContent(
    text: string,
    sourceName: string
  ): {
    allowed: boolean;
    sanitized: string;
    injectionDetected: boolean;
    reason?: string;
  } {
    const sanitized =
      this.sanitizeExternalContent(
        text,
        sourceName
      );

    const injectionDetected =
      this.detectInjectionAttempts(
        text
      );

    if (
      injectionDetected
    ) {
      return {
        allowed: false,
        sanitized,
        injectionDetected: true,
        reason:
          'Contenido externo sospechoso bloqueado.',
      };
    }

    return {
      allowed: true,
      sanitized,
      injectionDetected: false,
    };
  }

  /**
   * Registra un bloqueo de seguridad.
   */
  private recordBlock(
    ruleId: string,
    details: string
  ): void {
    const state =
      this.db.getState();

    const rule =
      state.securityRules.find(
        (item) =>
          item.id === ruleId
      );

    if (rule) {
      rule.blocksCount += 1;
      rule.lastBlocked =
        new Date().toISOString();
    }

    this.db.addEvent({
      type: 'SECURITY_BLOCK',
      severity: 'WARNING',
      title:
        'Bloqueo de seguridad',
      message: details,
      metadata: {
        ruleId,
      },
    });

    this.db.save();
  }
}
