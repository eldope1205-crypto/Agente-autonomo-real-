import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Database } from '../db/database.js';
import { AgentCore } from '../modules/agent/index.js';
import { AgentScheduler } from '../modules/scheduler/index.js';
import { SourceManager } from '../modules/sources/index.js';
import { TaskManager } from '../modules/tasks/index.js';
import { TaskExecutor } from '../modules/executor/index.js';
import { FinanceManager } from '../modules/finance/index.js';
import { SubAgentManager } from '../modules/agents/index.js';
import { LearningEngine } from '../modules/learning/index.js';
import { ToolRegistry } from '../modules/tools/index.js';
import { SystemStatus } from '../../src/types/index.js';

export const apiRouter = Router();

const db = Database.getInstance();
const agent = AgentCore.getInstance();
const scheduler = AgentScheduler.getInstance();
const sources = SourceManager.getInstance();
const tasks = TaskManager.getInstance();
const executor = TaskExecutor.getInstance();
const finance = FinanceManager.getInstance();
const subAgents = SubAgentManager.getInstance();
const learning = LearningEngine.getInstance();
const tools = ToolRegistry.getInstance();

// Helper to compute system status
function computeSystemStatus(): SystemStatus {
  const state = db.getState();
  const totalOpps = state.opportunities.length;
  const newOpps = state.opportunities.filter((o) => o.status === 'NEW').length;
  const readyOpps = state.opportunities.filter((o) => o.status === 'READY').length;
  const completedOpps = state.opportunities.filter((o) => o.status === 'COMPLETED').length;
  const rejectedOpps = state.opportunities.filter((o) => o.status === 'REJECTED').length;
  const blockedOpps = state.opportunities.filter((o) => o.status === 'BLOCKED').length;

  const totalTasks = state.tasks.length;
  const readyTasks = state.tasks.filter((t) => t.status === 'READY').length;
  const runningTasks = state.tasks.filter((t) => t.status === 'RUNNING').length;
  const completedTasks = state.tasks.filter((t) => t.status === 'COMPLETED').length;
  const needsHuman = state.tasks.filter((t) => t.status === 'NEEDS_HUMAN').length;
  const blockedTasks = state.tasks.filter((t) => t.status === 'BLOCKED').length;
  const failedTasks = state.tasks.filter((t) => t.status === 'FAILED').length;

  const activeSources = state.sources.filter((s) => s.status === 'ACTIVE' && s.enabled).length;
  const totalSources = state.sources.length;

  const recentErrors = state.events.filter((e) => e.severity === 'ERROR').length;

  return {
    agentStatus: state.agent.status,
    currentMode: state.agent.mode,
    currentCycleStep: state.agent.cycleStep,
    cycleCount: state.agent.cycleCount,
    lastActivity: state.agent.lastActivity,
    schedulerActive: state.agent.schedulerActive,
    opportunitiesCount: {
      total: totalOpps,
      new: newOpps,
      ready: readyOpps,
      completed: completedOpps,
      rejected: rejectedOpps,
      blocked: blockedOpps,
    },
    tasksCount: {
      total: totalTasks,
      ready: readyTasks,
      running: runningTasks,
      completed: completedTasks,
      needsHuman,
      blocked: blockedTasks,
      failed: failedTasks,
    },
    activeSourcesCount: activeSources,
    totalSourcesCount: totalSources,
    finances: state.finances,
    recentErrorsCount: recentErrors,
    geminiConfigured: tools.isGeminiAvailable(),
  };
}

// 1. System Status
apiRouter.get('/status', (req: Request, res: Response) => {
  res.json(computeSystemStatus());
});

// 2. Opportunities
apiRouter.get('/opportunities', (req: Request, res: Response) => {
  const { status, limit } = req.query;
  let opps = db.getState().opportunities;
  if (status && typeof status === 'string') {
    opps = opps.filter((o) => o.status === status);
  }
  const max = limit ? parseInt(limit as string, 10) : 100;
  res.json(opps.slice(0, max));
});

// 3. Tasks
apiRouter.get('/tasks', (req: Request, res: Response) => {
  const { status } = req.query;
  let taskList = tasks.getTasks();
  if (status && typeof status === 'string') {
    taskList = taskList.filter((t) => t.status === status);
  }
  res.json(taskList);
});

// 4. Sources
apiRouter.get('/sources', (req: Request, res: Response) => {
  res.json(sources.getSources());
});

// 5. Capabilities
apiRouter.get('/capabilities', (req: Request, res: Response) => {
  res.json(db.getState().capabilities);
});

apiRouter.patch('/capabilities/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const cap = db.getState().capabilities.find((c) => c.id === id);
  if (!cap) return res.status(404).json({ error: 'Capacidad no encontrada' });
  cap.enabled = !cap.enabled;
  db.save();
  res.json(cap);
});

// 6. Tools
apiRouter.get('/tools', (req: Request, res: Response) => {
  res.json(db.getState().tools);
});

// 7. Memory
apiRouter.get('/memory', (req: Request, res: Response) => {
  const state = db.getState();
  res.json({
    version: state.version,
    agentStats: state.agent,
    totalOpportunities: state.opportunities.length,
    totalTasks: state.tasks.length,
    totalEvidence: state.evidence.length,
    totalTransactions: state.transactions.length,
    totalEvents: state.events.length,
    lastUpdate: state.agent.lastActivity,
  });
});

// 8. Events
apiRouter.get('/events', (req: Request, res: Response) => {
  const { limit } = req.query;
  const max = limit ? parseInt(limit as string, 10) : 50;
  res.json(db.getState().events.slice(0, max));
});

// 9. Finances & Capital
apiRouter.get('/finances', (req: Request, res: Response) => {
  res.json({
    summary: finance.getSummary(),
    transactions: finance.getTransactions(),
    limits: finance.getLimits(),
  });
});

apiRouter.get('/capital', (req: Request, res: Response) => {
  res.json({
    summary: finance.getSummary(),
    limits: finance.getLimits(),
  });
});

// 10. Evidence
apiRouter.get('/evidence', (req: Request, res: Response) => {
  res.json(db.getState().evidence);
});

apiRouter.get('/evidence/file/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(db.getEvidenceDir(), filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo de evidencia no encontrado' });
  }
  res.sendFile(filePath);
});

// 11. Secondary Agents
apiRouter.get('/agents', (req: Request, res: Response) => {
  res.json(subAgents.getSubAgents());
});

apiRouter.post('/agents/:id/activate', (req: Request, res: Response) => {
  const result = subAgents.activateSubAgent(req.params.id);
  if (!result.success) {
    return res.status(400).json({ error: result.reason });
  }
  res.json(result.agent);
});

apiRouter.post('/agents/:id/pause', (req: Request, res: Response) => {
  const result = subAgents.pauseSubAgent(req.params.id);
  res.json(result);
});

// 12. Agent Controls
apiRouter.post('/agent/start', async (req: Request, res: Response) => {
  const status = await agent.start();
  scheduler.start();
  res.json({ status, system: computeSystemStatus() });
});

apiRouter.post('/agent/stop', async (req: Request, res: Response) => {
  const status = await agent.stop();
  scheduler.stop();
  res.json({ status, system: computeSystemStatus() });
});

apiRouter.post('/agent/pause', async (req: Request, res: Response) => {
  const status = await agent.pause();
  res.json({ status, system: computeSystemStatus() });
});

apiRouter.post('/agent/resume', async (req: Request, res: Response) => {
  const status = await agent.resume();
  res.json({ status, system: computeSystemStatus() });
});

apiRouter.post('/agent/mode', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (mode !== 'OBSERVE' && mode !== 'PREPARE' && mode !== 'AUTHORIZED') {
    return res.status(400).json({ error: 'Modo no válido. Debe ser OBSERVE, PREPARE o AUTHORIZED.' });
  }
  agent.setMode(mode);
  res.json({ mode, system: computeSystemStatus() });
});

apiRouter.post('/agent/cycle', async (req: Request, res: Response) => {
  const result = await agent.runOneCycle();
  res.json({ cycleResult: result, system: computeSystemStatus() });
});

// 13. Task Actions
apiRouter.post('/tasks/:id/authorize', (req: Request, res: Response) => {
  const updated = tasks.authorizeTask(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(updated);
});

apiRouter.post('/tasks/:id/cancel', (req: Request, res: Response) => {
  const { reason } = req.body;
  const updated = tasks.cancelTask(req.params.id, reason);
  if (!updated) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(updated);
});

apiRouter.post('/tasks/:id/resolve-human', async (req: Request, res: Response) => {
  const { notes } = req.body;
  const result = await executor.continueTaskAfterHuman(req.params.id, notes);
  if (!result.success && result.error === 'Tarea no encontrada') {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }
  res.json(result);
});

apiRouter.post('/tasks/execute-all', async (req: Request, res: Response) => {
  const result = await executor.executeAllTasks();
  res.json(result);
});

apiRouter.post('/tasks/:id/execute', async (req: Request, res: Response) => {
  const task = tasks.getTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  if (task.status !== 'AUTHORIZED' && task.status !== 'READY') {
    return res.status(400).json({ error: `La tarea no se puede ejecutar en estado actual: ${task.status}` });
  }
  task.status = 'AUTHORIZED';
  const result = await executor.executeTask(task);
  res.json(result);
});

apiRouter.post('/tasks/plan-from-opportunity', (req: Request, res: Response) => {
  const { opportunityId } = req.body;
  const opp = db.getState().opportunities.find((o) => o.id === opportunityId);
  if (!opp) return res.status(404).json({ error: 'Oportunidad no encontrada' });
  const planned = tasks.planTaskFromOpportunity(opp);
  res.json(planned);
});

// 14. Source Actions
apiRouter.post('/sources', (req: Request, res: Response) => {
  const { name, url, type, category, description } = req.body;
  if (!name || !url || !type) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios (name, url, type)' });
  }
  try {
    const created = sources.addSource({ name, url, type, category, description });
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/sources/:id', (req: Request, res: Response) => {
  const removed = sources.removeSource(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Fuente no encontrada' });
  res.json({ success: true });
});

apiRouter.patch('/sources/:id/toggle', (req: Request, res: Response) => {
  const { enabled } = req.body;
  const updated = sources.toggleSource(req.params.id, Boolean(enabled));
  if (!updated) return res.status(404).json({ error: 'Fuente no encontrada' });
  res.json(updated);
});

apiRouter.post('/sources/:id/test', async (req: Request, res: Response) => {
  try {
    const result = await sources.testSource(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. Financial Operations
apiRouter.post('/finances/income', (req: Request, res: Response) => {
  try {
    const tx = finance.registerIncome(req.body);
    res.json(tx);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/finances/confirm-income', (req: Request, res: Response) => {
  const { transactionId, proofReference } = req.body;
  if (!transactionId || !proofReference) {
    return res.status(400).json({ error: 'Se requiere transactionId y comprobante/referencia de pago real.' });
  }
  try {
    const confirmed = finance.confirmIncome(transactionId, proofReference);
    res.json(confirmed);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/finances/expense', (req: Request, res: Response) => {
  try {
    const tx = finance.registerExpense({
      ...req.body,
      authorizedByHuman: true,
    });
    res.json(tx);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 16. Learning
apiRouter.get('/learning', (req: Request, res: Response) => {
  res.json(learning.getInsights());
});

apiRouter.post('/learning/evaluate', (req: Request, res: Response) => {
  const insight = learning.evaluatePerformance();
  res.json(insight);
});

// 17. Security
apiRouter.get('/security', (req: Request, res: Response) => {
  res.json({
    rules: db.getState().securityRules,
    events: db.getState().events.filter((e) => e.type === 'SECURITY_BLOCK'),
  });
});

// 18. Settings
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json(db.getState().settings);
});

apiRouter.post('/settings', (req: Request, res: Response) => {
  const current = db.getState().settings;
  db.getState().settings = { ...current, ...req.body };
  db.saveImmediate();
  res.json(db.getState().settings);
});
