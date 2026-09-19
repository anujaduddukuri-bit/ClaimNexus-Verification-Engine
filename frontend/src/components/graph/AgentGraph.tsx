import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ExecutionEvent } from '../../types';
import { CheckCircle2, Loader2, AlertCircle, ShieldCheck, Compass } from 'lucide-react';

interface CustomNodeData extends Record<string, unknown> {
  label: string;
  subText: string;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  isCurrent?: boolean;
}

const CustomAgentNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
  const getColors = () => {
    if (data.isCurrent) {
      return 'border-[#B46A45] bg-[#B46A45]/20 text-[#E5DED0] ring-2 ring-[#B46A45] shadow-copper';
    }
    switch (data.status) {
      case 'RUNNING':
        return 'border-[#C29B5B] bg-[#C29B5B]/20 text-[#C29B5B] shadow-gold';
      case 'SUCCESS':
        return 'border-[#4E8752] bg-[#4E8752]/15 text-[#E5DED0]';
      case 'ERROR':
        return 'border-[#B44C43] bg-[#B44C43]/20 text-[#E5DED0]';
      default:
        return 'border-[#304036] bg-[#15201A] text-[#9A9B91]';
    }
  };

  return (
    <div className={`px-4 py-3 rounded-lg border min-w-[180px] transition-all duration-300 relative ${getColors()}`}>
      <Handle type="target" position={Position.Top} className="!bg-[#B46A45] !w-2.5 !h-2.5" />
      
      {data.isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#B46A45] text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-subtle">
          <Compass className="w-3 h-3 animate-spin" />
          <span>CURRENT POINTER</span>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {data.status === 'RUNNING' && <Loader2 className="w-4 h-4 animate-spin text-[#C29B5B]" />}
        {data.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-[#4E8752]" />}
        {data.status === 'ERROR' && <AlertCircle className="w-4 h-4 text-[#B44C43]" />}
        {data.status === 'IDLE' && <ShieldCheck className="w-4 h-4 opacity-40 text-[#9A9B91]" />}
        <span className="font-sans text-xs font-bold tracking-wide text-[#E5DED0]">{data.label}</span>
      </div>
      
      <p className="text-[10px] text-[#9A9B91] font-mono mt-1 border-t border-[#304036]/60 pt-1">{data.subText}</p>

      <Handle type="source" position={Position.Bottom} className="!bg-[#B46A45] !w-2.5 !h-2.5" />
    </div>
  );
};

const nodeTypes = {
  agentNode: CustomAgentNode,
};

interface AgentGraphProps {
  events: ExecutionEvent[];
}

export const AgentGraph: React.FC<AgentGraphProps> = ({ events }) => {
  const getStepStatus = (stepName: string): 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR' => {
    const matched = (events || []).filter(e => (e?.step || '').toLowerCase().includes(stepName.toLowerCase()));
    if (!matched.length) return 'IDLE';
    const last = matched[matched.length - 1];
    if (last.status === 'IN_PROGRESS') return 'RUNNING';
    if (last.status === 'COMPLETED') return 'SUCCESS';
    if (last.status === 'FAILED') return 'ERROR';
    return 'IDLE';
  };

  const currentStep = useMemo(() => {
    const running = (events || []).filter(e => e?.status === 'IN_PROGRESS');
    return running.length > 0 ? (running[running.length - 1].step || '') : '';
  }, [events]);

  const nodes: Node<CustomNodeData>[] = useMemo(() => [
    {
      id: 'query',
      type: 'agentNode',
      position: { x: 300, y: 20 },
      data: { label: '1. Claim Received', subText: 'Input Claim Submission', status: getStepStatus('CLAIM_RECEIVED'), isCurrent: currentStep.includes('CLAIM_RECEIVED') }
    },
    {
      id: 'analyzer',
      type: 'agentNode',
      position: { x: 300, y: 110 },
      data: { label: '2. Claim Analyzed', subText: 'Structure & Qualifiers', status: getStepStatus('CLAIM_ANALYZED'), isCurrent: currentStep.includes('CLAIM_ANALYZED') }
    },
    {
      id: 'gemini',
      type: 'agentNode',
      position: { x: 170, y: 210 },
      data: { label: '3. Gemini Research', subText: 'Google Gemini Agent', status: getStepStatus('GEMINI'), isCurrent: currentStep.includes('GEMINI') }
    },
    {
      id: 'groq',
      type: 'agentNode',
      position: { x: 430, y: 210 },
      data: { label: '4. Groq Research', subText: 'Groq LLaMA-3 Agent', status: getStepStatus('GROQ'), isCurrent: currentStep.includes('GROQ') }
    },
    {
      id: 'retrieval',
      type: 'agentNode',
      position: { x: 300, y: 310 },
      data: { label: '5. Evidence Retrieval', subText: 'External Grounding', status: getStepStatus('RETRIEVAL'), isCurrent: currentStep.includes('RETRIEVAL') }
    },
    {
      id: 'ev_analysis',
      type: 'agentNode',
      position: { x: 300, y: 400 },
      data: { label: '6. Evidence Analysis', subText: 'Classification & Quality', status: getStepStatus('EVIDENCE_ANALYSIS'), isCurrent: currentStep.includes('EVIDENCE_ANALYSIS') }
    },
    {
      id: 'clustering',
      type: 'agentNode',
      position: { x: 300, y: 490 },
      data: { label: '7. Claim Alignment', subText: 'Semantic Vector Engine', status: getStepStatus('CLUSTERING'), isCurrent: currentStep.includes('CLUSTERING') }
    },
    {
      id: 'conflict',
      type: 'agentNode',
      position: { x: 300, y: 580 },
      data: { label: '8. Conflict Detection', subText: 'Contradiction Audit', status: getStepStatus('CONFLICT'), isCurrent: currentStep.includes('CONFLICT') }
    },
    {
      id: 'critic',
      type: 'agentNode',
      position: { x: 170, y: 670 },
      data: { label: '9. Critic Review', subText: 'Critic Agent Audit', status: getStepStatus('CRITIC'), isCurrent: currentStep.includes('CRITIC') }
    },
    {
      id: 'verdict',
      type: 'agentNode',
      position: { x: 430, y: 670 },
      data: { label: '10. Verdict Generation', subText: 'Verdict Engine', status: getStepStatus('VERDICT'), isCurrent: currentStep.includes('VERDICT') }
    },
    {
      id: 'synthesis',
      type: 'agentNode',
      position: { x: 300, y: 760 },
      data: { label: '11. Final Synthesis', subText: 'Explainable Report', status: getStepStatus('SYNTHESIS'), isCurrent: currentStep.includes('SYNTHESIS') }
    }
  ], [events, currentStep]);

  const edges: Edge[] = useMemo(() => [
    { id: 'e1', source: 'query', target: 'analyzer', animated: true, style: { stroke: '#B46A45' } },
    { id: 'e2', source: 'analyzer', target: 'gemini', animated: true, style: { stroke: '#B46A45' } },
    { id: 'e3', source: 'analyzer', target: 'groq', animated: true, style: { stroke: '#B46A45' } },
    { id: 'e4', source: 'gemini', target: 'retrieval', animated: true, style: { stroke: '#C29B5B' } },
    { id: 'e5', source: 'groq', target: 'retrieval', animated: true, style: { stroke: '#C29B5B' } },
    { id: 'e6', source: 'retrieval', target: 'ev_analysis', animated: true, style: { stroke: '#C29B5B' } },
    { id: 'e7', source: 'ev_analysis', target: 'clustering', animated: true, style: { stroke: '#20372B' } },
    { id: 'e8', source: 'clustering', target: 'conflict', animated: true, style: { stroke: '#20372B' } },
    { id: 'e9', source: 'conflict', target: 'critic', animated: true, style: { stroke: '#4E8752' } },
    { id: 'e10', source: 'conflict', target: 'verdict', animated: true, style: { stroke: '#4E8752' } },
    { id: 'e11', source: 'critic', target: 'synthesis', animated: true, style: { stroke: '#4E8752' } },
    { id: 'e12', source: 'verdict', target: 'synthesis', animated: true, style: { stroke: '#4E8752' } },
  ], []);

  return (
    <div className="w-full h-[780px] bg-[#15201A] rounded-xl overflow-hidden relative border border-[#304036] shadow-subtle">
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-[#0D1512]/90 px-3.5 py-2 rounded-lg border border-[#304036]">
        <Compass className="w-4 h-4 text-[#B46A45]" />
        <span className="text-xs font-mono text-[#E5DED0] font-semibold tracking-wide">11-STAGE VERIFICATION GRAPH</span>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#304036" gap={20} size={1} />
        <Controls className="bg-[#0D1512] border-[#304036] text-[#E5DED0]" />
      </ReactFlow>
    </div>
  );
};
