import { useState, useMemo } from "react";
import { Moon, Puzzle, CheckCircle2, XCircle, Sparkles, Eye, RotateCcw } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { BREEDS, DISEASE_NAMES, ELEMENT_EMOJI, DISEASE_SYMPTOMS } from "@/data/gameData";
import type { DiseaseType, DreamSession, DreamFragment } from "@/types/game";

const FRAGMENT_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  color: { label: "色彩", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  sound: { label: "声音", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  scene: { label: "场景", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  emotion: { label: "情绪", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
};

function DreamSessionCard({ session }: { session: DreamSession }) {
  const [selectedFrags, setSelectedFrags] = useState<string[]>(session.placedFragments);
  const [interpretation, setInterpretation] = useState<DiseaseType | null>(session.interpretation);
  const [submitted, setSubmitted] = useState(session.isResolved);
  const interpretDream = useGameStore(s => s.interpretDream);

  const breed = BREEDS.find(b => b.id === session.breedId);

  const sortedFragments = useMemo(() => {
    const order: Record<string, number> = { color: 0, sound: 1, scene: 2, emotion: 3 };
    return [...session.fragments].sort((a, b) => order[a.type] - order[b.type]);
  }, [session.fragments]);

  const toggleFragment = (fragId: string) => {
    if (submitted) return;
    setSelectedFrags(prev =>
      prev.includes(fragId) ? prev.filter(id => id !== fragId) : [...prev, fragId]
    );
  };

  const handleSubmit = () => {
    if (!interpretation || selectedFrags.length === 0) return;
    interpretDream(session.id, selectedFrags, interpretation);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedFrags([]);
    setInterpretation(null);
    setSubmitted(false);
  };

  const selectedCount = selectedFrags.length;
  const totalFragments = session.fragments.length;
  const hasMinSelection = selectedCount >= 2;

  const diseaseOptions = useMemo(() => {
    const diseaseSet = new Set<DiseaseType>();
    session.fragments.forEach(f => f.relatedDiseases.forEach(d => diseaseSet.add(d)));
    return [...diseaseSet];
  }, [session.fragments]);

  const analysisDiseases = useMemo(() => {
    if (selectedFrags.length === 0) return [];
    const selectedFragsData = session.fragments.filter(f => selectedFrags.includes(f.id));
    const counts: Record<string, number> = {};
    selectedFragsData.forEach(f => {
      f.relatedDiseases.forEach(d => {
        counts[d] = (counts[d] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([disease, count]) => ({
        disease: disease as DiseaseType,
        count,
        rate: Math.round((count / selectedFragsData.length) * 100),
      }));
  }, [selectedFrags, session.fragments]);

  return (
    <div className={`card p-5 transition-all duration-300 ${submitted ? (session.interpretation === session.correctDisease ? "border-clinic-jade/50 shadow-glow" : "border-clinic-crisis/50") : "border-purple-200/60"}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-inner border border-purple-200/50 flex items-center justify-center text-3xl flex-shrink-0">
          {breed?.emoji || "🐾"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg text-clinic-deep">{session.beastName}</h3>
            <span className="text-[11px] text-gray-500">{breed?.name}</span>
            <span className="text-[11px]">{ELEMENT_EMOJI[breed?.element || "neutral"]}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="text-purple-600">第{session.day}天梦境</span>
            {submitted ? (
              session.interpretation === session.correctDisease ? (
                <span className="tag bg-emerald-50 border border-emerald-300 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> 梦诊正确
                </span>
              ) : (
                <span className="tag bg-red-50 border border-red-300 text-red-700">
                  <XCircle className="w-3 h-3" /> 判断有误
                </span>
              )
            ) : (
              <span className="tag bg-purple-50 border border-purple-300 text-purple-700">
                <Moon className="w-3 h-3" /> 待解读
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Puzzle className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-clinic-deep">梦境碎片</span>
          <span className="ml-auto text-[10px] text-gray-500">
            已选 <span className="text-purple-700 font-semibold">{selectedCount}</span>/{totalFragments}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {sortedFragments.map(frag => {
            const typeInfo = FRAGMENT_TYPE_LABELS[frag.type];
            const isSelected = selectedFrags.includes(frag.id);
            return (
              <button
                key={frag.id}
                onClick={() => toggleFragment(frag.id)}
                disabled={submitted}
                className={`relative p-2.5 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? `${typeInfo.bg} shadow-md scale-[1.02]`
                    : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
                } ${submitted ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{frag.emoji}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${typeInfo.bg} ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                </div>
                <div className="text-xs font-medium text-clinic-deep">{frag.content}</div>
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center shadow-sm">
                    {selectedFrags.indexOf(frag.id) + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {analysisDiseases.length > 0 && !submitted && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-purple-200/40">
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-clinic-deep">线索分析</span>
          </div>
          <div className="space-y-1.5">
            {analysisDiseases.slice(0, 5).map(({ disease, count, rate }) => (
              <div key={disease} className="flex items-center gap-2">
                <span className="text-xs text-clinic-deep font-medium w-20 truncate">{DISEASE_NAMES[disease]}</span>
                <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 transition-all duration-500"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-[10px] text-purple-700 font-semibold tabular-nums w-10 text-right">{rate}%</span>
                <span className="text-[10px] text-gray-400">({count}条)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!submitted && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-clinic-amber" />
            <span className="text-sm font-semibold text-clinic-deep">梦境解读</span>
            <span className="ml-auto text-[10px] text-gray-400">选择你的判断</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {diseaseOptions.map(disease => {
              const sel = interpretation === disease;
              return (
                <button
                  key={disease}
                  onClick={() => setInterpretation(sel ? null : disease)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    sel
                      ? "border-clinic-jade bg-clinic-jade/10 shadow-sm"
                      : "border-gray-200 bg-white hover:border-purple-300"
                  }`}
                >
                  <span className="text-xs font-medium text-clinic-deep">{DISEASE_NAMES[disease]}</span>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {DISEASE_SYMPTOMS[disease].slice(0, 2).join("、")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {submitted ? (
        <div className="space-y-2">
          <div className={`p-3 rounded-xl text-sm ${
            session.interpretation === session.correctDisease
              ? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800"
              : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-800"
          }`}>
            {session.interpretation === session.correctDisease ? (
              <div>
                <div className="font-semibold flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-4 h-4" /> 梦诊正确！
                </div>
                <div className="text-xs">
                  正确疾病：<span className="font-semibold">{DISEASE_NAMES[session.correctDisease]}</span>
                  {session.unlockedHiddenSymptom && (
                    <div className="mt-1 text-purple-700">
                      🔓 隐藏症状已解锁：<span className="font-semibold">{session.unlockedHiddenSymptom}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="font-semibold flex items-center gap-1 mb-1">
                  <XCircle className="w-4 h-4" /> 判断有误
                </div>
                <div className="text-xs">
                  你的判断：{DISEASE_NAMES[session.interpretation!]} → 正确答案：
                  <span className="font-semibold">{DISEASE_NAMES[session.correctDisease]}</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleReset}
            className="w-full py-1.5 rounded-lg border border-purple-200 text-purple-600 text-xs hover:bg-purple-50 transition-colors flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> 重新解读
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!interpretation || !hasMinSelection}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:bg-gray-300"
        >
          <Moon className="w-4 h-4" />
          提交梦诊判断
        </button>
      )}
    </div>
  );
}

export default function DreamDiagnosisPage() {
  const dreamSessions = useGameStore(s => s.dreamSessions);

  const unresolvedSessions = dreamSessions.filter(s => !s.isResolved);
  const resolvedSessions = dreamSessions.filter(s => s.isResolved);

  return (
    <div className="container px-4 py-4 animate-fade">
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center text-xl shadow-inner">
          🌙
        </div>
        <div>
          <h2 className="font-display text-xl text-clinic-deep">灵兽梦诊</h2>
          <p className="text-xs text-gray-500">夜晚降临，疑难病例的梦境碎片浮现…拼接线索，解锁隐藏症状</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="tag bg-purple-50 border border-purple-200 text-purple-700">
            待解读 {unresolvedSessions.length}
          </span>
          <span className="tag bg-emerald-50 border border-emerald-200 text-emerald-700">
            已完成 {resolvedSessions.length}
          </span>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50/60 via-purple-50/60 to-pink-50/60 border border-purple-200/30">
        <div className="flex items-start gap-2">
          <Moon className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-purple-800 space-y-1">
            <p className="font-semibold">梦诊指南</p>
            <ol className="list-decimal list-inside space-y-0.5 text-purple-700">
              <li>每晚21时，重度及以上灵兽会生成梦境碎片</li>
              <li>碎片分为<span className="font-medium">色彩、声音、场景、情绪</span>四种类型</li>
              <li>选择与梦境相关的碎片，系统会分析线索指向</li>
              <li>根据分析结果做出疾病判断，提交梦诊结论</li>
              <li>正确梦诊：解锁隐藏症状 + 治疗耗时降低 + 成功率提升</li>
              <li>错误梦诊：成功率略微下降，可重新解读</li>
            </ol>
          </div>
        </div>
      </div>

      {dreamSessions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">😴</div>
          <p className="text-gray-500 text-sm">尚无梦境碎片</p>
          <p className="text-gray-400 text-xs mt-1">当候诊队列中出现重度及以上灵兽时，每晚21时将自动生成梦境碎片</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unresolvedSessions.length > 0 && (
            <div>
              <h3 className="font-display text-sm text-purple-700 mb-2 flex items-center gap-1.5">
                <Moon className="w-4 h-4" /> 待解读梦境
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {unresolvedSessions.map(session => (
                  <DreamSessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          )}

          {resolvedSessions.length > 0 && (
            <div>
              <h3 className="font-display text-sm text-gray-500 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 已解读梦境
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {resolvedSessions.map(session => (
                  <DreamSessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
