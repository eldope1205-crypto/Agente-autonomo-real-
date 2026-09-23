import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client.js';
import {
  SystemStatus,
  Opportunity,
  Task,
  Source,
  Capability,
  Tool,
  FinancialSummary,
  FinancialLimits,
  Transaction,
  EvidenceItem,
  AgentEvent,
  SubAgent,
  LearningInsight,
  SecurityRule,
  AppSettings,
  AgentMode,
} from './types/index.js';

import { Header } from './components/Header.js';
import { Navigation } from './components/Navigation.js';
import { DashboardView } from './components/DashboardView.js';
import { AgentView } from './components/AgentView.js';
import { OpportunitiesView } from './components/OpportunitiesView.js';
import { TasksView } from './components/TasksView.js';
import { SourcesView } from './components/SourcesView.js';
import { CapabilitiesView } from './components/CapabilitiesView.js';
import { ToolsView } from './components/ToolsView.js';
import { FinancesView } from './components/FinancesView.js';
import { CapitalView } from './components/CapitalView.js';
import { EvidenceView } from './components/EvidenceView.js';
import { MemoryView } from './components/MemoryView.js';
import { SecurityView } from './components/SecurityView.js';
import { AgentsView } from './components/AgentsView.js';
import { LearningView } from './components/LearningView.js';
import { EventsView } from './components/EventsView.js';
import { SettingsView } from './components/SettingsView.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [finances, setFinances] = useState<{
    summary: FinancialSummary;
    transactions: Transaction[];
    limits: FinancialLimits;
  } | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [memoryData, setMemoryData] = useState<any>(null);
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [securityData, setSecurityData] = useState<{ rules: SecurityRule[]; events: AgentEvent[] }>({
    rules: [],
    events: [],
  });
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Transient UX States
  const [isCycling, setIsCycling] = useState(false);
  const [lastCycleResult, setLastCycleResult] = useState<any>(null);
  const [isEvaluatingLearning, setIsEvaluatingLearning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Main fetch function
  const fetchAllData = useCallback(async () => {
    try {
      const [
        statusRes,
        oppsRes,
        tasksRes,
        sourcesRes,
        capsRes,
        toolsRes,
        finRes,
        eviRes,
        eventsRes,
        memRes,
        agentsRes,
        learnRes,
        secRes,
        setRes,
      ] = await Promise.all([
        api.getStatus().catch(() => null),
        api.getOpportunities().catch(() => []),
        api.getTasks().catch(() => []),
        api.getSources().catch(() => []),
        api.getCapabilities().catch(() => []),
        api.getTools().catch(() => []),
        api.getFinances().catch(() => null),
        api.getEvidence().catch(() => []),
        api.getEvents(80).catch(() => []),
        api.getMemory().catch(() => null),
        api.getAgents().catch(() => []),
        api.getLearning().catch(() => []),
        api.getSecurity().catch(() => ({ rules: [], events: [] })),
        api.getSettings().catch(() => null),
      ]);

      if (statusRes) setStatus(statusRes);
      setOpportunities(oppsRes);
      setTasks(tasksRes);
      setSources(sourcesRes);
      setCapabilities(capsRes);
      setTools(toolsRes);
      if (finRes) setFinances(finRes);
      setEvidence(eviRes);
      setEvents(eventsRes);
      setMemoryData(memRes);
      setSubAgents(agentsRes);
      setLearningInsights(learnRes);
      setSecurityData(secRes);
      if (setRes) setSettings(setRes);
    } catch (err) {
      console.error('[App] Error al actualizar estado del agente:', err);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3500);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Agent Operations
  const handleStartAgent = async () => {
    try {
      const res = await api.startAgent();
      setStatus(res.system);
      showToast('Agente iniciado con éxito');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al iniciar agente');
    }
  };

  const handleStopAgent = async () => {
    try {
      const res = await api.stopAgent();
      setStatus(res.system);
      showToast('Agente detenido');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al detener agente');
    }
  };

  const handlePauseAgent = async () => {
    try {
      const res = await api.pauseAgent();
      setStatus(res.system);
      showToast('Agente pausado');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al pausar agente');
    }
  };

  const handleResumeAgent = async () => {
    try {
      const res = await api.resumeAgent();
      setStatus(res.system);
      showToast('Agente reanudado');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al reanudar agente');
    }
  };

  const handleChangeMode = async (mode: AgentMode) => {
    try {
      const res = await api.setAgentMode(mode);
      setStatus(res.system);
      showToast(`Modo cambiado a ${mode}`);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar modo');
    }
  };

  const handleRunCycle = async () => {
    setIsCycling(true);
    try {
      const res = await api.runCycle();
      setLastCycleResult(res.cycleResult);
      setStatus(res.system);
      showToast(res.cycleResult?.details || 'Ciclo finalizado');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al ejecutar ciclo');
    } finally {
      setIsCycling(false);
    }
  };

  // Opportunities / Tasks Actions
  const handlePlanTask = async (opportunityId: string) => {
    try {
      const planned = await api.planFromOpportunity(opportunityId);
      showToast(`Tarea planificada: ${planned.title}`);
      fetchAllData();
      setActiveTab('tasks');
    } catch (err: any) {
      showToast(err.message || 'Error al planificar tarea');
    }
  };

  const handleAuthorizeTask = async (taskId: string) => {
    try {
      await api.authorizeTask(taskId);
      showToast('Tarea autorizada para ejecución');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al autorizar tarea');
    }
  };

  const handleExecuteTask = async (taskId: string) => {
    try {
      showToast('Ejecutando tarea y generando entregable...');
      const res = await api.executeTaskNow(taskId);
      if (res.success) {
        showToast('Tarea ejecutada y firmada con SHA-256');
      } else {
        showToast(res.error || 'Tarea bloqueada o no ejecutable');
      }
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al ejecutar tarea');
    }
  };

  const handleExecuteAllTasks = async () => {
    try {
      setIsCycling(true);
      showToast('Iniciando ejecución de tareas disponibles...');
      const res = await api.executeAllTasks();
      showToast(`Tareas procesadas: ${res.executed} ejecutadas, ${res.blocked} bloqueadas, ${res.completed} completadas.`);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al ejecutar tareas');
    } finally {
      setIsCycling(false);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await api.cancelTask(taskId);
      showToast('Tarea cancelada');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar');
    }
  };

  const handleResolveHuman = async (taskId: string, notes?: string) => {
    try {
      showToast('Reanudando tarea tras resolución humana...');
      await api.resolveHumanIntervention(taskId, notes);
      showToast('Intervención humana resuelta y tarea procesada');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al resolver intervención');
    }
  };

  // Sources Actions
  const handleAddSource = async (data: any) => {
    await api.addSource(data);
    showToast('Fuente pública agregada');
    fetchAllData();
  };

  const handleRemoveSource = async (id: string) => {
    if (!confirm('¿Eliminar esta fuente pública?')) return;
    await api.removeSource(id);
    showToast('Fuente eliminada');
    fetchAllData();
  };

  const handleToggleSource = async (id: string, enabled: boolean) => {
    await api.toggleSource(id, enabled);
    fetchAllData();
  };

  const handleTestSource = async (id: string) => {
    return await api.testSource(id);
  };

  // Capabilities Actions
  const handleToggleCapability = async (id: string) => {
    await api.toggleCapability(id);
    fetchAllData();
  };

  // Finances Actions
  const handleRegisterIncome = async (data: any) => {
    await api.registerIncome(data);
    showToast('Ingreso registrado en el libro mayor');
    fetchAllData();
  };

  const handleConfirmIncome = async (txId: string, proof: string) => {
    await api.confirmIncome(txId, proof);
    showToast('Pago confirmado. Fondos liberados al capital disponible.');
    fetchAllData();
  };

  const handleRegisterExpense = async (data: any) => {
    await api.registerExpense(data);
    showToast('Gasto confirmado registrado');
    fetchAllData();
  };

  // Sub-Agents Actions
  const handleActivateAgent = async (id: string) => {
    await api.activateAgent(id);
    showToast('Sub-agente especializado activado');
    fetchAllData();
  };

  const handlePauseSubAgent = async (id: string) => {
    await api.pauseAgentSub(id);
    showToast('Sub-agente pausado');
    fetchAllData();
  };

  // Learning Actions
  const handleEvaluateLearning = async () => {
    setIsEvaluatingLearning(true);
    try {
      const insight = await api.evaluateLearning();
      showToast('Evaluación completada con nuevas propuestas');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al evaluar aprendizaje');
    } finally {
      setIsEvaluatingLearning(false);
    }
  };

  // Settings Actions
  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    await api.updateSettings(newSettings);
    showToast('Configuración guardada correctamente');
    fetchAllData();
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl shadow-indigo-600/30 border border-indigo-400/40 animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        status={status}
        onStart={handleStartAgent}
        onStop={handleStopAgent}
        onPause={handlePauseAgent}
        onResume={handleResumeAgent}
        onRunCycle={handleRunCycle}
        onExecuteTasks={handleExecuteAllTasks}
        onChangeMode={handleChangeMode}
        isCycling={isCycling}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            opportunities: status?.opportunitiesCount?.ready,
            tasksReady: status?.tasksCount?.ready,
            needsHuman: status?.tasksCount?.needsHuman,
            evidence: evidence.length,
          }}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Dynamic Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              status={status}
              events={events}
              onNavigateTab={setActiveTab}
              onRunCycle={handleRunCycle}
              isCycling={isCycling}
            />
          )}

          {activeTab === 'agent' && (
            <AgentView
              status={status}
              onStart={handleStartAgent}
              onStop={handleStopAgent}
              onPause={handlePauseAgent}
              onResume={handleResumeAgent}
              onRunCycle={handleRunCycle}
              onChangeMode={handleChangeMode}
              isCycling={isCycling}
              cycleResult={lastCycleResult}
            />
          )}

          {activeTab === 'opportunities' && (
            <OpportunitiesView
              opportunities={opportunities}
              onPlanTask={handlePlanTask}
              onRefresh={fetchAllData}
              loading={isCycling}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              onAuthorize={handleAuthorizeTask}
              onExecute={handleExecuteTask}
              onExecuteAll={handleExecuteAllTasks}
              onCancel={handleCancelTask}
              onResolveHuman={handleResolveHuman}
              onViewEvidence={(file) => setActiveTab('evidence')}
              loading={isCycling}
            />
          )}

          {activeTab === 'sources' && (
            <SourcesView
              sources={sources}
              onAddSource={handleAddSource}
              onRemoveSource={handleRemoveSource}
              onToggleSource={handleToggleSource}
              onTestSource={handleTestSource}
            />
          )}

          {activeTab === 'capabilities' && (
            <CapabilitiesView
              capabilities={capabilities}
              onToggle={handleToggleCapability}
            />
          )}

          {activeTab === 'tools' && <ToolsView tools={tools} />}

          {activeTab === 'finances' && (
            <FinancesView
              finances={finances}
              onRegisterIncome={handleRegisterIncome}
              onConfirmIncome={handleConfirmIncome}
              onRegisterExpense={handleRegisterExpense}
            />
          )}

          {activeTab === 'capital' && (
            <CapitalView
              summary={finances?.summary}
              limits={finances?.limits}
              subAgents={subAgents}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'evidence' && <EvidenceView evidence={evidence} />}

          {activeTab === 'memory' && <MemoryView memoryData={memoryData} />}

          {activeTab === 'security' && (
            <SecurityView
              rules={securityData.rules}
              blockedEvents={securityData.events}
            />
          )}

          {activeTab === 'agents' && (
            <AgentsView
              subAgents={subAgents}
              availableCapital={finances?.summary?.availableCapital || 0}
              onActivate={handleActivateAgent}
              onPause={handlePauseSubAgent}
            />
          )}

          {activeTab === 'learning' && (
            <LearningView
              insights={learningInsights}
              onEvaluate={handleEvaluateLearning}
              loading={isEvaluatingLearning}
            />
          )}

          {activeTab === 'events' && <EventsView events={events} />}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}
