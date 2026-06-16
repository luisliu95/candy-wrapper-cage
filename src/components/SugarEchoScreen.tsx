import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

type Stage = 'incoming' | 'message' | 'inspect' | 'result';

export default function SugarEchoScreen() {
  const {
    currentFakeMessage, sugarEchoFlawOptions, chapter,
    judgeFlaw, dismissSugarEcho, fakeMessageHistory
  } = useGameStore();

  const [stage, setStage] = useState<Stage>('incoming');
  const [typedText, setTypedText] = useState('');
  const [judgeResult, setJudgeResult] = useState<{
    correct: boolean;
    hint: string;
    detail: string;
  } | null>(null);
  const [glitchActive, setGlitchActive] = useState(false);

  const msg = currentFakeMessage;
  if (!msg) return null;

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
    const t = setTimeout(() => setStage('message'), 2000);
    return () => clearTimeout(t);
  }, []);

  // 随机 glitch
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

  const handleInspect = () => {
    setStage('inspect');
  };

  const handleJudge = (flawType: string) => {
    const correct = flawType === msg.flaw;
    setJudgeResult({
      correct,
      hint: correct ? msg.flawHint : '这不是正确的漏洞类型……SugarEcho 注意到了你的审查行为。',
      detail: correct ? msg.flawDetail : '',
    });
    judgeFlaw(flawType);
    setStage('result');
  };

  const handleDismiss = () => {
    dismissSugarEcho();
  };

  const handleResultClose = () => {
    dismissSugarEcho();
  };

  // 已识破的章节数
  const detectedCount = fakeMessageHistory.filter(h => h.detected).length;

  return (
    <div className="sugarecho-screen">
      {/* 背景干扰 */}
      <div className={`sugarecho-bg ${glitchActive ? 'glitch' : ''}`} />

      {/* 阶段一：来信提示 */}
      {stage === 'incoming' && (
        <div className="sugarecho-incoming">
          <div className="echo-icon">📱</div>
          <div className="echo-system-label">SugarEcho v2.7</div>
          <div className="echo-incoming-text">正在生成替身消息……</div>
          <div className="echo-loading">
            <span className="echo-dot" />
            <span className="echo-dot" />
            <span className="echo-dot" />
          </div>
          <div className="echo-chapter-tag">第 {chapter} 章结束</div>
        </div>
      )}

      {/* 阶段二：显示消息 */}
      {stage === 'message' && (
        <div className="sugarecho-message-view">
          <div className="echo-header">
            <span className="echo-header-label">📤 已发送消息</span>
            <span className="echo-header-time">{msg.timestamp}</span>
          </div>

          <div className="echo-phone">
            <div className="echo-phone-status">
              <span>💬 消息</span>
              <span className="echo-phone-battery">■■■□ 67%</span>
            </div>
            <div className="echo-chat-bubble sent">
              <div className="echo-bubble-sender">{msg.sender}</div>
              <div className="echo-bubble-text">{typedText}</div>
              <div className="echo-bubble-time">{msg.timestamp} ✓✓</div>
            </div>
          </div>

          <div className="echo-warning-bar">
            ⚠ SugarEcho 已代替莫妮卡向外界发送此消息
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
            </div>
          )}
        </div>
      )}

      {/* 阶段三：选择漏洞 */}
      {stage === 'inspect' && (
        <div className="sugarecho-inspect">
          <div className="echo-inspect-header">
            <h3>🔍 审查模式</h3>
            <p>这条消息中隐藏着什么破绽？</p>
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
                <span className="flaw-type-icon">
                  {opt.type === 'fact' ? '📋' :
                   opt.type === 'tone' ? '🗣️' :
                   opt.type === 'logic' ? '🧠' :
                   opt.type === 'vocabulary' ? '📝' :
                   opt.type === 'contradiction' ? '⚡' :
                   opt.type === 'manipulation' ? '🎭' :
                   opt.type === 'awareness' ? '👁️' :
                   opt.type === 'glitch' ? '🔧' :
                   opt.type === 'identity' ? '👤' :
                   opt.type === 'cover_up' ? '🕳️' :
                   opt.type === 'gaslighting' ? '💨' :
                   opt.type === 'reference' ? '🔗' :
                   opt.type === 'pattern' ? '📊' :
                   opt.type === 'promise' ? '🤞' : '❓'}
                </span>
                {opt.label}
              </button>
            ))}
          </div>

          <button className="pixel-btn btn-small" onClick={() => setStage('message')} style={{ marginTop: 12 }}>
            ← 再看一遍消息
          </button>
        </div>
      )}

      {/* 阶段四：结果 */}
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
              ? <span className="effect-tag evidence">证据 +3</span>
              : <span className="effect-tag alert">警戒 +2</span>
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
