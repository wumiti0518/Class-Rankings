import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_GROUPS, Group, Member, LogEntry } from './constants';
import { Trophy, Download, RotateCcw, GripVertical, MoreVertical, UserCog, Send, FileSpreadsheet, History, Trash2, Clock, Save, Edit2, ChevronDown, ChevronUp, Plus, Minus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { pinyin } from 'pinyin-pro';

export default function App() {
  const [currentGroups, setCurrentGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('class_quantization_groups');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('class_quantization_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState<string | null>(null);
  
  const [draggedMemberInfo, setDraggedMemberInfo] = useState<{ groupId: number; memberIdx: number } | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState<number | null>(null);
  const [movingMember, setMovingMember] = useState<{ groupId: number; memberIdx: number } | null>(null);
  const [activeSelectGroup, setActiveSelectGroup] = useState<number | null>(null);
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const [viewingLogId, setViewingLogId] = useState<string>('current');
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedGroupIdForNewMember, setSelectedGroupIdForNewMember] = useState<number | ''>('');

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setMovingMember(null);
        setActiveSelectGroup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('class_quantization_groups', JSON.stringify(currentGroups));
  }, [currentGroups]);

  useEffect(() => {
    localStorage.setItem('class_quantization_logs', JSON.stringify(logs));
  }, [logs]);

  // Computed data based on selection
  const displayGroups = useMemo(() => {
    if (viewingLogId === 'current') return currentGroups;
    const log = logs.find(l => l.id === viewingLogId);
    return log?.data || currentGroups;
  }, [viewingLogId, currentGroups, logs]);

  const isReadOnly = viewingLogId !== 'current';

  // Save functions (now just state updates)
  const saveData = (groups: Group[]) => {
    setCurrentGroups(groups);
  };

  const addLog = (type: LogEntry['type'], message: string, data?: Group[]) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const clearLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("确定要清空所有活动日志吗？")) {
      setLogs([]);
    }
  };

  const saveWeeklySnapshot = () => {
    const defaultName = `第 ${new Date().toLocaleDateString('zh-CN')} 周量化指标`;
    const name = window.prompt("请输入本次保存的名称：", defaultName);
    if (name !== null) {
      addLog('save', name || defaultName, currentGroups);
      setIsLogExpanded(true);
    }
  };

  const addGroup = () => {
    if (isReadOnly) return;
    const nextId = currentGroups.length > 0 ? Math.max(...currentGroups.map(g => g.id)) + 1 : 1;
    const newGroup: Group = {
      id: nextId,
      leader: "",
      members: []
    };
    const updatedGroups = [...currentGroups, newGroup];
    saveData(updatedGroups);
    addLog('move', `新增了第 ${nextId} 小组`);
  };

  const removeGroup = () => {
    if (isReadOnly || currentGroups.length === 0) return;
    const lastGroup = currentGroups[currentGroups.length - 1];
    
    const hasMembers = lastGroup.members.length > 0 || lastGroup.leader !== "";
    if (hasMembers) {
      if (!window.confirm(`第 ${lastGroup.id} 小组中还有成员或组长，确定要删除吗？`)) {
        return;
      }
    }

    const updatedGroups = currentGroups.slice(0, -1);
    saveData(updatedGroups);
    addLog('move', `删除了第 ${lastGroup.id} 小组`);
  };

  const addMember = () => {
    if (isReadOnly || !newMemberName.trim() || selectedGroupIdForNewMember === '') return;
    
    const newGroups = JSON.parse(JSON.stringify(currentGroups));
    const targetGroup = newGroups.find((g: Group) => g.id === selectedGroupIdForNewMember);
    
    if (!targetGroup) return;

    const newMember: Member = {
      name: newMemberName.trim(),
      score: 0,
      bonus: 0
    };

    targetGroup.members.push(newMember);
    saveData(newGroups);
    addLog('move', `向第 ${selectedGroupIdForNewMember} 小组添加了成员：${newMemberName}`);
    setNewMemberName('');
  };

  const removeMember = (groupId: number, memberIdx: number) => {
    if (isReadOnly) return;
    
    const memberName = currentGroups.find(g => g.id === groupId)?.members[memberIdx]?.name;
    if (!window.confirm(`确定要删除成员 ${memberName} 吗？`)) return;

    const newGroups = JSON.parse(JSON.stringify(currentGroups));
    const targetGroup = newGroups.find((g: Group) => g.id === groupId);
    
    if (targetGroup) {
      targetGroup.members.splice(memberIdx, 1);
      saveData(newGroups);
      addLog('move', `删除了第 ${groupId} 小组的成员：${memberName}`);
      setMovingMember(null);
    }
  };

  const renameLog = (e: React.MouseEvent, logId: string, currentMessage: string) => {
    e.stopPropagation();
    alert("重命名功能目前仅限管理员手动操作数据库。");
  };

  const handleDragStart = (groupId: number, memberIdx: number) => {
    setDraggedMemberInfo({ groupId, memberIdx });
  };

  const handleDrop = (targetGroupId: number) => {
    if (!draggedMemberInfo) return;

    const { groupId: sourceGroupId, memberIdx } = draggedMemberInfo;
    if (sourceGroupId === targetGroupId) {
      setDraggedMemberInfo(null);
      setDropTargetGroupId(null);
      return;
    }

    const newGroups = JSON.parse(JSON.stringify(currentGroups));
    const sourceGroup = newGroups.find((g: Group) => g.id === sourceGroupId);
    const targetGroup = newGroups.find((g: Group) => g.id === targetGroupId);

    const [draggedMember] = sourceGroup.members.splice(memberIdx, 1);
    targetGroup.members.push(draggedMember);

    saveData(newGroups);
    setDraggedMemberInfo(null);
    setDropTargetGroupId(null);
  };

  const moveMemberToGroup = (sourceGroupId: number, memberIdx: number, targetGroupId: number) => {
    if (sourceGroupId === targetGroupId) {
      setMovingMember(null);
      return;
    }

    const newGroups = JSON.parse(JSON.stringify(currentGroups));
    const sourceGroup = newGroups.find((g: Group) => g.id === sourceGroupId);
    const targetGroup = newGroups.find((g: Group) => g.id === targetGroupId);

    if (!sourceGroup || !targetGroup) return;

    const [member] = sourceGroup.members.splice(memberIdx, 1);
    targetGroup.members.push(member);

    saveData(newGroups);
    setMovingMember(null);
  };

  const promoteToLeader = (groupId: number, memberIdx: number) => {
    const newGroups = JSON.parse(JSON.stringify(currentGroups));
    const group = newGroups.find((g: Group) => g.id === groupId);
    if (!group) return;

    const member = group.members[memberIdx];
    group.leader = member.name;

    // Move member to index 0
    const [targetMember] = group.members.splice(memberIdx, 1);
    group.members.unshift(targetMember);

    saveData(newGroups);
    setMovingMember(null);
  };

  const moveMemberByNameToGroup = (memberName: string, targetGroupId: number) => {
    const newGroups = JSON.parse(JSON.stringify(currentGroups));
    let sourceGroup: Group | null = null;
    let memberIdx = -1;

    for (const g of newGroups) {
      const idx = g.members.findIndex((m: Member) => m.name === memberName);
      if (idx !== -1) {
        sourceGroup = g;
        memberIdx = idx;
        break;
      }
    }

    if (!sourceGroup || sourceGroup.id === targetGroupId) {
      setActiveSelectGroup(null);
      return;
    }

    const [member] = sourceGroup.members.splice(memberIdx, 1);
    const targetGroup = newGroups.find((g: Group) => g.id === targetGroupId);
    targetGroup.members.push(member);

    saveData(newGroups);
    setActiveSelectGroup(null);
  };

  const exportToExcelGroup = () => {
    const data: any[] = [];
    // Headers
    data.push(["组长", "小组成员", "个人得分", "个人加分", "本周得分", "小组得分", "小组排名"]);

    currentGroups.forEach(group => {
      const avgScore = groupStats.find(s => s.id === group.id)?.avg || 0;
      const rank = rankMap[group.id];
      
      group.members.forEach((m, idx) => {
        const row = [
          idx === 0 ? group.leader : "", // Only show leader on first row of group for visual grouping
          m.name,
          m.score,
          m.bonus,
          Number(m.score) + Number(m.bonus),
          idx === 0 ? avgScore : "", // Only show avg on first row
          idx === 0 ? rank : ""      // Only show rank on first row
        ];
        data.push(row);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "小组量化");
    XLSX.writeFile(wb, "6.1班小组量化表.xlsx");
  };

  const exportToExcelPersonal = () => {
    const data: any[] = [];
    // Title row
    data.push(["下学期第一周个人量化"]);
    // Header row
    data.push(["序号", "姓名", "量化得分"]);

    allMembersSorted.forEach((m, idx) => {
      let currentRank = 1;
      if (idx > 0) {
        let tempIdx = idx;
        while (tempIdx > 0 && allMembersSorted[tempIdx].total === allMembersSorted[tempIdx - 1].total) {
          tempIdx--;
        }
        currentRank = tempIdx + 1;
      }
      data.push([currentRank, m.name, m.total]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Merge title row
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "个人量化");
    XLSX.writeFile(wb, "6.1班个人量化表.xlsx");
  };

  const updateScore = (groupId: number, memberIdx: number, field: 'score' | 'bonus', value: string) => {
    const newGroups = JSON.parse(JSON.stringify(currentGroups));
    const group = newGroups.find((g: Group) => g.id === groupId);
    const member = group.members[memberIdx];
    member[field] = Number(value);
    saveData(newGroups);
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentGroups, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "61_class_ranking_v21.json");
    dl.click();
  };

  const resetToInitial = () => {
    if (window.confirm("确定要重置所有数据到默认状态吗？")) {
      saveData(JSON.parse(JSON.stringify(INITIAL_GROUPS)));
      setViewingLogId('current');
    }
  };

  const groupStats = useMemo(() => {
    return displayGroups.map(group => {
      const total = group.members.reduce((sum, m) => sum + (Number(m.score) + Number(m.bonus)), 0);
      const avg = group.members.length > 0 ? Math.round(total / group.members.length) : 0;
      return { id: group.id, avg };
    });
  }, [displayGroups]);

  const rankMap = useMemo(() => {
    const sortedStats = [...groupStats].sort((a, b) => b.avg - a.avg);
    const map: Record<number, number> = {};
    sortedStats.forEach((stat, idx) => {
      if (idx > 0 && stat.avg === sortedStats[idx - 1].avg) {
        map[stat.id] = map[sortedStats[idx - 1].id];
      } else {
        map[stat.id] = idx + 1;
      }
    });
    return map;
  }, [groupStats]);

  const allMembersSorted = useMemo(() => {
    const members: (Member & { groupName: string; total: number })[] = [];
    displayGroups.forEach(g => {
      g.members.forEach(m => {
        members.push({ ...m, groupName: `第 ${g.id} 组`, total: Number(m.score) + Number(m.bonus) });
      });
    });
    return members.sort((a, b) => b.total - a.total);
  }, [displayGroups]);

  const groupedMembers = useMemo(() => {
    const groups: Record<string, (Member & { groupName: string; total: number })[]> = {};
    
    allMembersSorted.forEach(m => {
      const firstLetter = pinyin(m.name, { pattern: 'first', toneType: 'none' })[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(m);
    });

    const sortedKeys = Object.keys(groups).sort();
    
    sortedKeys.forEach(key => {
      groups[key].sort((a, b) => {
        const pinyinA = pinyin(a.name, { toneType: 'none' });
        const pinyinB = pinyin(b.name, { toneType: 'none' });
        return pinyinA.localeCompare(pinyinB);
      });
    });

    return { keys: sortedKeys, groups };
  }, [allMembersSorted]);

  return (
    <div className="min-h-screen bg-[#fcfaf8] p-4 md:p-8 font-sans text-slate-800 relative">
      {/* Week Selector - Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm p-1 flex items-center gap-2">
          <div className="pl-3 pr-1 py-1">
            <History size={14} className="text-slate-500" />
          </div>
          <select 
            value={viewingLogId}
            onChange={(e) => setViewingLogId(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8"
          >
            <option value="current">当前实时数据</option>
            {logs.filter(l => l.type === 'save' && l.data).map(log => (
              <option key={log.id} value={log.id}>
                {log.message} ({new Date(log.timestamp).toLocaleDateString()})
              </option>
            ))}
          </select>
          {isReadOnly && (
            <div className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg mr-1 animate-pulse">
              只读模式
            </div>
          )}
        </div>
      </div>

      <header className="max-w-7xl mx-auto mb-12 pt-8 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          班级量化管理系统
        </h1>
        <div className="mt-2 h-1 w-64 bg-indigo-600 mx-auto rounded-full"></div>
        
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={saveWeeklySnapshot}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 font-bold text-sm group"
          >
            <Save size={18} className="group-hover:scale-110 transition-transform" />
            保存本周指标
          </button>
          <button
            onClick={resetToInitial}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-bold text-sm"
          >
            <RotateCcw size={18} /> 重置数据
          </button>
        </div>
      </header>

      {/* Group Grid Section */}
      <div className="max-w-7xl mx-auto mb-4 flex flex-col gap-4">
        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-4">
            {/* Group Management - Compact */}
            <div className="inline-flex bg-white rounded-xl shadow-sm border border-slate-200 p-0.5">
              <button
                onClick={addGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all font-bold text-[11px]"
                title="增加小组"
              >
                <Plus size={14} /> 增加小组
              </button>
              <div className="w-px bg-slate-100 my-1.5 mx-0.5"></div>
              <button
                onClick={removeGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all font-bold text-[11px]"
                title="减少小组"
              >
                <Minus size={14} /> 减少小组
              </button>
            </div>

            {/* Member Management - Compact */}
            <div className="inline-flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-0.5 gap-1">
              <input
                type="text"
                placeholder="输入姓名"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="text-[11px] px-2 py-1.5 bg-slate-50 border-none focus:ring-1 focus:ring-indigo-500 rounded-lg w-24 font-medium"
              />
              <select
                value={selectedGroupIdForNewMember}
                onChange={(e) => setSelectedGroupIdForNewMember(e.target.value === '' ? '' : Number(e.target.value))}
                className="text-[11px] px-2 py-1.5 bg-slate-50 border-none focus:ring-1 focus:ring-indigo-500 rounded-lg w-20 font-medium cursor-pointer"
              >
                <option value="">选小组</option>
                {currentGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.id}组</option>
                ))}
              </select>
              <button
                onClick={addMember}
                disabled={!newMemberName.trim() || selectedGroupIdForNewMember === ''}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all font-bold text-[11px]"
              >
                <Plus size={12} /> 添加成员
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {displayGroups.map((group) => {
          const avgScore = groupStats.find(s => s.id === group.id)?.avg || 0;
          const rank = rankMap[group.id];
          const isDropTarget = dropTargetGroupId === group.id;

          return (
            <div
              key={group.id}
              className={`bg-white rounded-xl shadow-sm border transition-all duration-200 flex flex-col ${
                isDropTarget ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200'
              } ${isReadOnly ? 'opacity-90 grayscale-[0.2]' : ''}`}
              onDragOver={(e) => {
                if (isReadOnly) return;
                e.preventDefault();
                setDropTargetGroupId(group.id);
              }}
              onDragLeave={() => setDropTargetGroupId(null)}
              onDrop={() => !isReadOnly && handleDrop(group.id)}
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">第 {group.id} 组</span>
                  <h3 className="text-lg font-bold text-slate-800">组长：{group.leader}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-600">{avgScore}</div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${rank <= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    排名 #{rank}
                  </div>
                </div>
              </div>

              {/* Quick Select Member Button */}
              {!isReadOnly && (
                <div className="px-4 py-2 border-b border-slate-100 bg-white relative menu-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSelectGroup(activeSelectGroup === group.id ? null : group.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all border border-dashed border-slate-200"
                  >
                    <UserCog size={14} /> 选择小组成员
                  </button>
                  
                  {activeSelectGroup === group.id && (
                    <div className="absolute left-4 right-4 top-full mt-1 z-[60] bg-white border border-slate-200 shadow-2xl rounded-xl p-2 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="text-[10px] font-bold text-slate-400 mb-2 px-2 py-1 border-b border-slate-50">
                        点击姓名移入本组：
                      </div>
                      <div className="space-y-4">
                        {groupedMembers.keys.map(letter => {
                          const membersInLetter = groupedMembers.groups[letter].filter(m => !group.members.some(gm => gm.name === m.name));
                          if (membersInLetter.length === 0) return null;
                          
                          return (
                            <div key={letter} className="space-y-1">
                              <div className="text-[10px] font-black text-indigo-400 px-2 flex items-center gap-2">
                                <span className="w-4 h-4 flex items-center justify-center bg-indigo-50 rounded text-[9px]">{letter}</span>
                                <div className="h-[1px] flex-grow bg-slate-100"></div>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                {membersInLetter.map(m => (
                                  <button
                                    key={m.name}
                                    onClick={() => moveMemberByNameToGroup(m.name, group.id)}
                                    className="text-[11px] text-left px-2 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition-colors truncate font-medium text-slate-700 flex items-center justify-between group/btn"
                                    title={`当前在：${m.groupName}`}
                                  >
                                    <span>{m.name}</span>
                                    <span className="text-[8px] opacity-0 group-hover/btn:opacity-60 transition-opacity">{m.groupName}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="p-2 flex-grow space-y-1">
                <AnimatePresence mode="popLayout">
                  {group.members.map((m, idx) => {
                    const memberTotal = Number(m.score) + Number(m.bonus);
                    const rankInGroup = group.members.filter(other => (Number(other.score) + Number(other.bonus)) > memberTotal).length + 1;
                    
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={`${m.name}-${idx}`}
                        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors group ${isReadOnly ? '' : 'cursor-grab active:cursor-grabbing'}`}
                        draggable={!isReadOnly}
                        onDragStart={() => !isReadOnly && handleDragStart(group.id, idx)}
                      >
                        {!isReadOnly && (
                          <span className="text-slate-300 group-hover:text-indigo-400">
                            <GripVertical size={16} />
                          </span>
                        )}
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-slate-700">{m.name}</div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              rankInGroup === 1 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                              rankInGroup === 2 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                              rankInGroup === 3 ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                              'bg-slate-50 text-slate-400 border border-slate-100'
                            }`}>
                              #{rankInGroup}
                            </span>
                            {!isReadOnly && (
                              <div className="relative menu-container">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMovingMember(movingMember?.groupId === group.id && movingMember?.memberIdx === idx ? null : { groupId: group.id, memberIdx: idx });
                                  }}
                                  className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-indigo-600"
                                  title="成员管理"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {movingMember?.groupId === group.id && movingMember?.memberIdx === idx && (
                                  <div className={`absolute left-0 ${idx >= group.members.length - 2 && group.members.length > 2 ? 'bottom-full mb-1' : 'top-full mt-1'} z-50 bg-white border border-slate-200 shadow-2xl rounded-xl p-3 min-w-[200px] animate-in fade-in zoom-in duration-150`}>
                                    <div className="space-y-2 mb-3">
                                      <button
                                        onClick={() => promoteToLeader(group.id, idx)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                                      >
                                        <UserCog size={14} /> 升为小组长
                                      </button>
                                      <button
                                        onClick={() => removeMember(group.id, idx)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                                      >
                                        <Trash2 size={14} /> 删除成员
                                      </button>
                                    </div>
                                    
                                    <div className="border-t border-slate-100 pt-3">
                                      <div className="text-[10px] font-bold text-slate-400 mb-2 px-1 flex items-center gap-1">
                                        <Send size={10} /> 移动至小组：
                                      </div>
                                      <div className="grid grid-cols-4 gap-1">
                                        {currentGroups.map(g => (
                                          <button
                                            key={g.id}
                                            onClick={() => moveMemberToGroup(group.id, idx, g.id)}
                                            className={`text-[10px] font-bold py-1.5 rounded transition-colors ${g.id === group.id ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white'}`}
                                            disabled={g.id === group.id}
                                          >
                                            {g.id}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-3 text-[10px] mt-0.5">
                            <span className="text-slate-400">
                              得分: 
                              <input
                                type="number"
                                value={m.score}
                                disabled={isReadOnly}
                                className="w-10 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none text-slate-600 font-bold text-center ml-1 disabled:opacity-50"
                                onChange={(e) => updateScore(group.id, idx, 'score', e.target.value)}
                              />
                            </span>
                            <span className="text-slate-400">
                              加分: 
                              <input
                                type="number"
                                value={m.bonus}
                                disabled={isReadOnly}
                                className="w-10 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none text-slate-600 font-bold text-center ml-1 disabled:opacity-50"
                                onChange={(e) => updateScore(group.id, idx, 'bonus', e.target.value)}
                              />
                            </span>
                          </div>
                        </div>
                        <div className={`text-sm font-black ${m.score + m.bonus >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {m.score + m.bonus}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rankings Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Personal Ranking Section */}
        <section className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-indigo-600 p-6 text-center">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center justify-center gap-2">
              <Trophy size={24} /> 个人总分实时排名榜
            </h2>
            <p className="text-indigo-100 text-xs mt-1">根据 (个人得分 + 个人加分) 实时计算</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto flex-grow">
            <AnimatePresence mode="popLayout">
              {allMembersSorted.map((m, idx) => {
                let currentRank = 1;
                if (idx > 0) {
                  let tempIdx = idx;
                  while (tempIdx > 0 && allMembersSorted[tempIdx].total === allMembersSorted[tempIdx - 1].total) {
                    tempIdx--;
                  }
                  currentRank = tempIdx + 1;
                }

                let badgeClass = 'bg-slate-100 text-slate-500';
                if (currentRank === 1) badgeClass = 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
                else if (currentRank === 2) badgeClass = 'bg-gradient-to-br from-slate-300 to-slate-500 text-white';
                else if (currentRank === 3) badgeClass = 'bg-gradient-to-br from-orange-400 to-orange-700 text-white';

                return (
                  <motion.div
                    layout
                    key={`${m.name}-${m.groupName}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full font-black text-sm ${badgeClass} mr-4 shadow-sm`}>
                      {currentRank}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{m.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">{m.groupName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-black ${m.total < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                        {m.total} <span className="text-[10px] text-slate-400 font-normal">分</span>
                      </div>
                      <div className="text-[10px] text-slate-300">基分 {m.score} / 加分 {m.bonus}</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* Group Ranking Section */}
        <section className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-emerald-600 p-6 text-center">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center justify-center gap-2">
              <Trophy size={24} /> 小组平均分排名榜
            </h2>
            <p className="text-emerald-100 text-xs mt-1">根据小组内成员总分的平均值实时计算</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto flex-grow">
            <AnimatePresence mode="popLayout">
              {[...groupStats].sort((a, b) => b.avg - a.avg).map((stat, idx, sortedArr) => {
                let currentRank = 1;
                if (idx > 0) {
                  let tempIdx = idx;
                  while (tempIdx > 0 && sortedArr[tempIdx].avg === sortedArr[tempIdx - 1].avg) {
                    tempIdx--;
                  }
                  currentRank = tempIdx + 1;
                }

                let badgeClass = 'bg-slate-100 text-slate-500';
                if (currentRank === 1) badgeClass = 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
                else if (currentRank === 2) badgeClass = 'bg-gradient-to-br from-slate-300 to-slate-500 text-white';
                else if (currentRank === 3) badgeClass = 'bg-gradient-to-br from-orange-400 to-orange-700 text-white';

                const group = currentGroups.find(g => g.id === stat.id);

                return (
                  <motion.div
                    layout
                    key={`group-rank-${stat.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full font-black text-sm ${badgeClass} mr-4 shadow-sm`}>
                      {currentRank}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">第 {stat.id} 组</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">组长: {group?.leader}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-black ${stat.avg < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {stat.avg} <span className="text-[10px] text-slate-400 font-normal">平均分</span>
                      </div>
                      <div className="text-[10px] text-slate-300">{group?.members.length} 位成员</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Activity Log Section */}
      <div className="max-w-2xl mx-auto mb-12">
        <section className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
          <div 
            className="bg-slate-800 p-3 flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={() => setIsLogExpanded(!isLogExpanded)}
          >
            <div className="flex items-center gap-2">
              <History size={16} className="text-white" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                保存记录日志
              </h2>
              <span className="text-slate-400 text-[10px] ml-1">({logs.length} 条记录)</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={clearLogs}
                className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 text-[10px] font-bold"
              >
                <Trash2 size={12} /> 清空
              </button>
              {isLogExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </div>
          </div>
          
          <AnimatePresence>
            {isLogExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto bg-slate-50/30">
                  {logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      暂无保存记录
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="p-2.5 flex items-start gap-3 hover:bg-white transition-colors">
                        <div className="mt-0.5 p-1 rounded bg-emerald-100 text-emerald-600">
                          <Save size={12} />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-700 font-medium">{log.message}</p>
                            <button 
                              onClick={(e) => renameLog(e, log.id, log.message)}
                              className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                              title="重命名"
                            >
                              <Edit2 size={10} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                            <Clock size={9} />
                            {new Date(log.timestamp).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Footer Export Buttons */}
      <footer className="max-w-7xl mx-auto border-t border-slate-200 pt-8 pb-12 flex flex-col md:flex-row justify-center items-center gap-6">
        <button
          onClick={exportToExcelGroup}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 font-bold text-lg group"
        >
          <FileSpreadsheet className="group-hover:scale-110 transition-transform" />
          导出小组 Excel 表格
        </button>
        <button
          onClick={exportToExcelPersonal}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 font-bold text-lg group"
        >
          <FileSpreadsheet className="group-hover:scale-110 transition-transform" />
          导出个人 Excel 表格
        </button>
      </footer>
    </div>
  );
}
