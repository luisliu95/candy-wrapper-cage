import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { getDetectionReward } from '../store/sugarEchoEngine';

type Stage = 'incoming' | 'message' | 'inspect' | 'result';

/** 漏洞类型对应的图标 */
const FLAW_ICONS: Record<string, string> = {
  punctuation: '✏️', preference: '🍰', official: '📋', secret_code: '🔐',
  betrayal: '🗡️', memory: '🧠', fact: '📋', logic: '🧠', contradiction: '⚡',
  manipulation: '🎭', reference: '🔗', identity: '👤', awareness: '👁️',
  glitch: '🔧', pattern: '📊', promise: '🤞', gaslighting: '💨',
  cover_up: '🕳️', vocabulary: '📝', tone: '🗣️',
};

export default function SugarEchoScreen() {
  const {
    currentFakeMessage, sugarEchoFlawOptions, chapter, alert,
    judgeFlaw, dismissSugarEcho, fakeMessageHistory, memoryFragments
  } = useGameStore();

  const [stage, setStage] = useState<Stage>('incoming');
  const [typedText, setTypedText] = useState('');
  const [judgeResult, setJudgeResult] = useState<{
    correct: boolean;
    hint: string;
    detail: string;
    bonusText: string;
  } | null>(null);
  const [glitchActive, setGlitchActive] = useState(false);
  const [showEchoNote, setShowEchoNote] = useState(false);

  const msg = currentFakeMessage;
  if (!msg) return null;

  const detectedCount = fakeMessageHistory.filter(h => h.detected).length;
  const difficulty = msg.difficulty ?? 1;

  // 打字机效果
  useEffect(() => {
    if (stage !== 'message') return;
    setTypedText('');
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= msg.text.length) {
        setTypedText(msg.text);
        clearInterval(timer);
      } else {
        setTypedText(msg.text.slice(0, i));
      }
    }, 35);
    return () => clearInterval(timer);
  }, [stage, msg.text]);

  // 进场动画
  useEffect(() => {
    const delay = alert >= 40 ? 1200 : 2000;
    const t = setTimeout(() => setStage('message'), delay);
    return () => clearTimeout(t);
  }, [alert]);

  // 随机 glitch（高警戒 / 多次识破时更频繁）
  useEffect(() => {
    const baseInterval = detectedCount >= 2 ? 1500 : alert >= 40 ? 2500 : 4000;
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, baseInterval + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [detectedCount, alert]);

  const handleInspect = () => setStage('inspect');

  const handleJudge = (flawType: string) => {
    const correct = flawType === msg.flaw;
    const reward = getDetectionReward(msg, detectedCount + (correct ? 1 : 0));

    setJudgeResult({
      correct,
      hint: correct ? msg.flawHint : '这不是正确的漏洞类型……SugarEcho 注意到了你的审查行为。',
      detail: correct ? msg.flawDetail : '',
      bonusText: correct ? reward.bonusText : `警戒 +${difficulty >= 3 ? 1 : 2}`,
    });
    judgeFlaw(flawType);
    setStage('result');
  };

  const handleDismiss = () => dismissSugarEcho();
  const handleResultClose = () => dismissSugarEcho();

  // 难度标签
  const diffLabel = difficulty >= 3 ? '极难' : difficulty >= 2 ? '中等' : '普通';
  const diffColor = difficulty >= 3 ? '#ff4444' : difficulty >= 2 ? '#ffaa00' : '#00ff88';

  // SugarEcho 学习进度（氛围数值）
  const echoLearningPct = Math.min(99, 60 + detectedCount * 5 + memoryFragments.length * 3);

  return (
    <div className="sugarecho-screen">
      <div className={`sugarecho-bg ${glitchActive ? 'glitch' : ''}`} />

      {/* === 阶段一：来信提示 === */}
      {stage === 'incoming' && (
        <div className="sugarecho-incoming">
          <div className="echo-icon">📱</div>
          <div className="echo-system-label">SugarEcho v2.7</div>
          <div className="echo-incoming-text">
            {detectedCount >= 2
              ? '正在重新校准人格模型……'
              : alert >= 40
                ? '正在生成高优先级安抚消息……'
                : '正在生成替身消息……'}
          </div>
          <div className="echo-loading">
            <span className="echo-dot" />
            <span className="echo-dot" />
            <span className="echo-dot" />
          </div>
          <div className="echo-chapter-tag">第 {chapter} 章结束</div>
          {detectedCount > 0 && (
            <div className="echo-learning-bar">
              <div className="echo-learning-label">人格学习进度</div>
              <div className="echo-learning-track">
                <div className="echo-learning-fill" style={{ width: `${echoLearningPct}%` }} />
              </div>
              <div className="echo-learning-pct">{echoLearningPct}%</div>
            </div>
          )}
        </div>
      )}

      {/* === 阶段二：显示消息 === */}
      {stage === 'message' && (
        <div className="sugarecho-message-view">
          <div className="echo-header">
            <span className="echo-header-label">📤 已发送消息</span>
            <span className="echo-header-time">{msg.timestamp}</span>
          </div>

          <div className="echo-phone">
            <div className="echo-phone-status">
              <span>💬 消息</span>
              <span className="echo-phone-battery">
                {alert >= 70 ? '■□□□ 12%' : alert >= 40 ? '■■□□ 43%' : '■■■□ 67%'}
              </span>
            </div>
            <div className="echo-chat-bubble sent">
              <div className="echo-bubble-sender">{msg.sender}</div>
              <div className="echo-bubble-text">{typedText}</div>
              <div className="echo-bubble-time">{msg.timestamp} ✓✓</div>
            </div>

            {/* SugarEcho 内心独白 */}
            {msg.echoNote && (
              <div className="echo-inner-note" onClick={() => setShowEchoNote(!showEchoNote)}>
                <span className="echo-note-toggle">{showEchoNote ? '▼' : '▶'} SugarEcho 内部日志</span>
                {showEchoNote && (
                  <div className="echo-note-content">{msg.echoNote}</div>
                )}
              </div>
            )}
          </div>

          <div className="echo-warning-bar">
            ⚠ SugarEcho 已代替莫妮卡向外界发送此消息
          </div>

          <div className="echo-message-meta">
            <span className="echo-diff-tag" style={{ borderColor: diffColor, color: diffColor }}>
              识别难度：{diffLabel}
            </span>
            {msg.category && msg.category !== 'general' && (
              <span className="echo-category-tag">
                {msg.category === 'punctuation' && '✏️ 标点伪装'}
                {msg.category === 'preference' && '🍰 偏好伪装'}
                {msg.category === 'official' && '📋 官方话术'}
                {msg.category === 'secret_code' && '🔐 暗号泄露'}
                {msg.category === 'betrayal' && '🗡️ 关系离间'}
                {msg.category === 'memory' && '🧠 记忆篡改'}
              </span>
            )}
          </div>

          <div className="echo-actions">
            <button className="pixel-btn btn-small" onClick={handleDismiss}>
              忽略消息
            </button>
            <button className="pixel-btn btn-small btn-accent" onClick={handleInspect}>
              🔍 审查消息
            </button>
          </div>

          {detectedCount > 0 && (
            <div className="echo-track-record">
              已识破 {detectedCount} 条伪造消息
              {detectedCount >= 2 && ' · SugarEcho 正在变得更谨慎……'}
            </div>
          )}
        </div>
      )}

      {/* === 阶段三：选择漏洞 === */}
      {stage === 'inspect' && (
        <div className="sugarecho-inspect">
          <div className="echo-inspect-header">
            <h3>🔍 审查模式</h3>
            <p>这条消息中隐藏着什么破绽？</p>
            {difficulty >= 2 && (
              <div className="echo-inspect-warning" style={{ color: diffColor }}>
                {difficulty >= 3
                  ? '⚠ SugarEcho 已学习了你的审查模式，漏洞更加隐蔽'
                  : '⚠ SugarEcho 加强了伪装，需要仔细观察'}
              </div>
            )}
          </div>

          <div className="echo-phone mini">
            <div className="echo-chat-bubble sent mini">
              <div className="echo-bubble-text">{msg.text}</div>
            </div>
          </div>

          <div className="echo-flaw-options">
            {sugarEchoFlawOptions.map(opt => (
              <button
                key={opt.type}
                className="echo-flaw-btn"
                onClick={() => handleJudge(opt.type)}
              >
                <span className="flaw-type-icon">{FLAW_ICONS[opt.type] || '❓'}</span>
                {opt.label}
              </button>
            ))}
          </div>

          <button className="pixel-btn btn-small" onClick={() => setStage('message')} style={{ marginTop: 12 }}>
            ← 再看一遍消息
          </button>
        </div>
      )}

      {/* === 阶段四：结果 === */}
      {stage === 'result' && judgeResult && (
        <div className="sugarecho-result">
          <div className={`echo-result-icon ${judgeResult.correct ? 'success' : 'fail'}`}>
            {judgeResult.correct ? '✓' : '✗'}
          </div>
          <h3 className={`echo-result-title ${judgeResult.correct ? 'success' : 'fail'}`}>
            {judgeResult.correct ? '识破伪装' : '判断失误'}
          </h3>
          <p className="echo-result-hint">{judgeResult.hint}</p>
          {judgeResult.correct && judgeResult.detail && (
            <div className="echo-result-detail">
              <div className="echo-detail-label">▸ SugarEcho 内部日志</div>
              <div className="echo-detail-text">{judgeResult.detail}</div>
            </div>
          )}
          <div className="echo-result-effect">
            {judgeResult.correct
              ? <span className="effect-tag evidence">{judgeResult.bonusText}</span>
              : <span className="effect-tag alert">{judgeResult.bonusText}</span>
            }
          </div>
          <button className="pixel-btn" onClick={handleResultClose} style={{ marginTop: 20 }}>
            继续
          </button>
        </div>
      )}

      <div className="scanlines" />
    </div>
  );
}
