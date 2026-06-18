import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { SteganMethod, LeafletResult } from '../types/game';
import methodsData from '../data/leafletMethods.json';

type Stage = 'briefing' | 'select' | 'crafting' | 'scanning' | 'result';

const methods = methodsData as SteganMethod[];

export default function LeafletGame() {
  const {
    evidence, alert, trust_medusa, trust_qiaoqing, inventory, flags,
    applyTrigger, showMessage, goToNode, hasItem, hasFlag
  } = useGameStore();
  const setPhase = useGameStore(s => s.phase === 'leaflet' ? true : false);

  const [stage, setStage] = useState<Stage>('briefing');
  const [selected, setSelected] = useState<SteganMethod | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [scanPhase, setScanPhase] = useState(0);
  const [result, setResult] = useState<LeafletResult | null>(null);
  const [craftProgress, setCraftProgress] = useState(0);

  // 已完成的传单任务
  const leafletDone = flags.includes('leaflet_completed');

  // 计算实际成功率
  const calcRate = useCallback((m: SteganMethod) => {
    let rate = m.baseSuccessRate;
    if (m.bonusItem && hasItem(m.bonusItem)) {
      rate += m.bonusRate;
    }
    // 乔青高羁绊加成
    if (m.qiaoBonusFlag && flags.includes(m.qiaoBonusFlag) && m.qiaoBonusRate) {
      rate += m.qiaoBonusRate;
    }
    // 高证据时稍有加成（你更了解这个地方）
    if (evidence >= 8) rate += 5;
    // 警戒等级影响成功率
    if (alert >= 70) rate -= 25;       // 高警戒：-25%
    else if (alert >= 40) rate -= 15;  // 中警戒：-15%
    else if (alert >= 5) rate -= 5;    // 微警戒：-5%
    return Math.max(5, Math.min(95, rate));
  }, [evidence, alert, hasItem, flags]);

  // 制作进度动画
  useEffect(() => {
    if (stage !== 'crafting') return;
    setCraftProgress(0);
    const timer = setInterval(() => {
      setCraftProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(() => setStage('scanning'), 300);
          return 100;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [stage]);

  // 扫描阶段动画
  useEffect(() => {
    if (stage !== 'scanning' || !selected) return;
    setScanPhase(0);
    const phases = selected.scanPhases.length;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      if (current >= phases) {
        clearInterval(timer);
        // 执行判定
        setTimeout(() => doJudgement(), 800);
      } else {
        setScanPhase(current);
      }
    }, 1200);
    return () => clearInterval(timer);
  }, [stage, selected]);

  const doJudgement = () => {
    if (!selected) return;
    const threshold = calcRate(selected);
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= threshold;

    const res: LeafletResult = {
      methodId: selected.id,
      success,
      roll,
      threshold,
      evidenceDelta: success ? selected.evidenceReward : 0,
      alertDelta: success ? 0 : selected.alertRisk,
    };

    setResult(res);

    // 应用效果
    if (success) {
      applyTrigger({
        evidence: selected.evidenceReward,
        setFlag: 'leaflet_completed',
        setFlags: [`leaflet_${selected.id}_success`],
      });
    } else {
      applyTrigger({
        alert: selected.alertRisk,
        setFlag: 'leaflet_completed',
        setFlags: [`leaflet_${selected.id}_fail`],
      });
    }

    setStage('result');
  };

  const handleFinish = () => {
    // 返回剧情
    useGameStore.setState({ phase: 'story' });
  };

  const canSeeHint = (m: SteganMethod) => trust_medusa >= m.medusaHintThreshold;

  // ===== 渲染 =====

  if (stage === 'briefing') {
    return (
      <div className="leaflet-screen">
        <div className="leaflet-bg" />
        <div className="leaflet-content">
          <div className="leaflet-briefing">
            <div className="leaflet-icon-large">📄</div>
            <h2 className="leaflet-title">传单隐写任务</h2>
            <div className="leaflet-briefing-text">
              <p>糖纸工坊要求你绘制一张新的招募传单。</p>
              <p>这是一个机会——你可以在传单中藏入求救信息，让外界知道这里的真相。</p>
              <p>但要小心。SugarEcho 会对所有传单进行 AI 扫描。如果暗号太明显，你就暴露了。</p>
            </div>
            <div className="leaflet-stats-preview">
              <span className="effect-tag evidence">当前证据 {evidence}</span>
              <span className="effect-tag alert">当前警戒 {alert}</span>
            </div>
            {alert >= 40 && (
              <div className="leaflet-alert-warning">
                ⚠️ {alert >= 70
                  ? '高警戒状态！SugarEcho扫描强度极高，成功率大幅降低（-25%）'
                  : '中警戒状态。SugarEcho已加强扫描，成功率降低（-15%）'}
              </div>
            )}
            <button className="pixel-btn" onClick={() => setStage('select')}>
              选择暗号方式 →
            </button>
          </div>
        </div>
        <div className="scanlines" />
      </div>
    );
  }

  if (stage === 'select') {
    return (
      <div className="leaflet-screen">
        <div className="leaflet-bg" />
        <div className="leaflet-content">
          <h2 className="leaflet-title">选择暗号方式</h2>
          <p className="leaflet-subtitle">每种方式的隐蔽性和收益不同。请慎重选择。</p>

          <div className="leaflet-methods">
            {methods.map(m => {
              const rate = calcRate(m);
              const hasBonus = m.bonusItem && hasItem(m.bonusItem);
              const hintAvailable = canSeeHint(m);

              return (
                <div
                  key={m.id}
                  className={`leaflet-method-card ${selected?.id === m.id ? 'selected' : ''}`}
                  onClick={() => { setSelected(m); setShowHint(false); }}
                >
                  <div className="method-header">
                    <span className="method-icon">{m.icon}</span>
                    <span className="method-name">{m.name}</span>
                  </div>
                  <p className="method-desc">{m.description}</p>
                  <div className="method-stats">
                    <div className="method-stat">
                      <span className="method-stat-label">成功率</span>
                      <div className="method-rate-bar">
                        <div
                          className="method-rate-fill"
                          style={{ width: `${rate}%` }}
                          data-rate={rate >= 70 ? 'high' : rate >= 50 ? 'mid' : 'low'}
                        />
                      </div>
                      <span className="method-rate-num">{rate}%</span>
                    </div>
                    <div className="method-rewards">
                      <span className="effect-tag evidence">+{m.evidenceReward} 证据</span>
                      <span className="effect-tag alert">风险 +{m.alertRisk}</span>
                    </div>
                  </div>
                  {hasBonus && (
                    <div className="method-bonus">
                      ✦ 物品加成：成功率 +{m.bonusRate}%
                    </div>
                  )}
                  {m.qiaoBonusFlag && flags.includes(m.qiaoBonusFlag) && m.qiaoBonusRate && (
                    <div className="method-bonus" style={{ color: '#00ff88' }}>
                      🎙️ 乔青加成：成功率 +{m.qiaoBonusRate}%
                      {m.qiaoBonusHint && <div style={{ fontSize: '0.8em', opacity: 0.8 }}>{m.qiaoBonusHint}</div>}
                    </div>
                  )}
                  {hintAvailable && selected?.id === m.id && (
                    <button
                      className="method-hint-btn"
                      onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}
                    >
                      🐍 美杜莎的建议
                    </button>
                  )}
                  {showHint && selected?.id === m.id && hintAvailable && (
                    <div className="method-hint-text">
                      {m.medusaHint}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="leaflet-select-actions">
            <button className="pixel-btn btn-small" onClick={() => setStage('briefing')}>
              ← 返回
            </button>
            <button
              className="pixel-btn btn-accent"
              disabled={!selected}
              onClick={() => selected && setStage('crafting')}
            >
              开始制作 →
            </button>
          </div>
        </div>
        <div className="scanlines" />
      </div>
    );
  }

  if (stage === 'crafting' && selected) {
    return (
      <div className="leaflet-screen">
        <div className="leaflet-bg" />
        <div className="leaflet-content">
          <div className="leaflet-crafting">
            <div className="leaflet-icon-large">{selected.icon}</div>
            <h2 className="leaflet-title">正在制作传单……</h2>
            <p className="leaflet-flavor">{selected.flavor}</p>
            <div className="craft-progress-bar">
              <div className="craft-progress-fill" style={{ width: `${craftProgress}%` }} />
            </div>
            <div className="craft-progress-label">{craftProgress}%</div>
          </div>
        </div>
        <div className="scanlines" />
      </div>
    );
  }

  if (stage === 'scanning' && selected) {
    return (
      <div className="leaflet-screen">
        <div className="leaflet-bg scanning" />
        <div className="leaflet-content">
          <div className="leaflet-scanning">
            <div className="scan-icon">🛡️</div>
            <h2 className="leaflet-title scan-title">SugarEcho 扫描中</h2>
            <div className="scan-phases">
              {selected.scanPhases.map((phase, i) => (
                <div key={i} className={`scan-phase ${i <= scanPhase ? 'active' : ''} ${i === scanPhase ? 'current' : ''}`}>
                  <span className="scan-phase-dot">{i < scanPhase ? '✓' : i === scanPhase ? '◈' : '○'}</span>
                  <span>{phase}</span>
                </div>
              ))}
            </div>
            <div className="scan-bar">
              <div className="scan-bar-inner" />
            </div>
          </div>
        </div>
        <div className="scanlines" />
      </div>
    );
  }

  if (stage === 'result' && selected && result) {
    return (
      <div className="leaflet-screen">
        <div className={`leaflet-bg ${result.success ? 'success' : 'fail'}`} />
        <div className="leaflet-content">
          <div className="leaflet-result">
            <div className={`result-badge ${result.success ? 'success' : 'fail'}`}>
              {result.success ? '✓' : '✗'}
            </div>
            <h2 className={`leaflet-title ${result.success ? 'text-success' : 'text-fail'}`}>
              {result.success ? '传单通过审核' : '传单被拦截'}
            </h2>
            <p className="leaflet-result-text">
              {result.success ? selected.successText : selected.failText}
            </p>

            <div className="leaflet-result-stats">
              <div className="result-roll">
                <span className="roll-label">判定骰点</span>
                <span className="roll-value">{result.roll}</span>
                <span className="roll-sep">/ 需要 ≤</span>
                <span className="roll-threshold">{result.threshold}</span>
              </div>
              <div className="result-effects">
                {result.success ? (
                  <span className="effect-tag evidence">证据 +{result.evidenceDelta}</span>
                ) : (
                  <span className="effect-tag alert">警戒 +{result.alertDelta}</span>
                )}
              </div>
            </div>

            <button className="pixel-btn" onClick={handleFinish}>
              继续 →
            </button>
          </div>
        </div>
        <div className="scanlines" />
      </div>
    );
  }

  return null;
}
