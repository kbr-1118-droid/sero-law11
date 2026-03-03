/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

// ✅ Google Apps Script 웹앱 URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw2MtqNO51ikt0nglz4pVOl7uVcBgYQ05nO6ASTvAkRTG_A9eMb1GzoF2mDvU7-Yfot/exec';

type Step = 'q1' | 'q1sub' | 'q2' | 'q3' | 'q4' | 'result-ok' | 'result-ng' | 'result-hold';
type NgReason = 'period' | 'income' | 'debt_low' | 'debt_high' | 'will' | null;

export default function App() {
  const [step, setStep] = useState<Step>('q1');
  const [progress, setProgress] = useState(25);
  const [q1SubType, setQ1SubType] = useState<'p' | 'r' | null>(null);
  const [ngReason, setNgReason] = useState<NgReason>(null);
  
  // 답변 저장 state
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '', result: '' });
  // 연락처 입력 state
  const [contactForm, setContactForm] = useState({ name: '', phone: '' });
  // 전송 중 상태
  const [isSending, setIsSending] = useState(false);

  const updateProgress = (stepNum: number, total: number = 4) => {
    const pct = Math.round((stepNum / total) * 100);
    setProgress(pct);
  };

  const setAnswer = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const goQ2 = (val?: string) => {
    if (val) setAnswer('q1', val);
    setStep('q2');
    updateProgress(2);
  };

  const goQ3 = (val: string) => {
    setAnswer('q2', val);
    setStep('q3');
    updateProgress(3);
  };

  const goQ4 = (val: string) => {
    setAnswer('q3', val);
    setStep('q4');
    updateProgress(4);
  };

  const showQ1Sub = (type: 'p' | 'r') => {
    setQ1SubType(type);
    setStep('q1sub');
    updateProgress(1);
  };

  const sendToSheet = async (name: string, phone: string, resultType: string, callback?: (success: boolean) => void) => {
    const payload = {
      name: name,
      phone: phone,
      q1: answers.q1 || '미응답',
      q2: answers.q2 || '미응답',
      q3: answers.q3 || '미응답',
      result: resultType || '미응답'
    };

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (callback) callback(true);
    } catch (error) {
      if (callback) callback(false);
    }
  };

  const showResult = (type: 'ok' | 'ng' | 'hold', reason: NgReason = null) => {
    let resultText = '';
    if (type === 'ok') resultText = '신청가능';
    else if (type === 'hold') resultText = '상담후결정';
    else resultText = '불가(' + reason + ')';

    setAnswer('result', resultText);

    if (type === 'ng') {
      setNgReason(reason);
      setStep('result-ng');
      // NG도 시트에 저장 (이름/연락처 없이 답변만)
      sendToSheet('(미입력)', '(미입력)', resultText);
    } else if (type === 'ok') {
      setStep('result-ok');
    } else if (type === 'hold') {
      setStep('result-hold');
    }
  };

  const submitContact = (resultType: string) => {
    const { name, phone } = contactForm;

    if (!name.trim() || !phone.trim()) {
      alert('이름과 연락처를 모두 입력해주세요.');
      return;
    }

    setIsSending(true);
    setAnswer('result', resultType);

    sendToSheet(name, phone, resultType, (success) => {
      setIsSending(false);
      if (success) {
        alert('✅ 접수되었습니다!\n담당자가 곧 연락드리겠습니다.');
      } else {
        alert('⚠️ 접수는 완료되었습니다.\n담당자가 곧 연락드리겠습니다.');
      }
    });
  };

  const resetForm = () => {
    setStep('q1');
    setProgress(25);
    setQ1SubType(null);
    setNgReason(null);
    setAnswers({ q1: '', q2: '', q3: '', result: '' });
    setContactForm({ name: '', phone: '' });
    setIsSending(false);
  };

  const goKakao = () => {
    alert('카카오톡 채널 링크를 여기에 연결해주세요.');
  };

  return (
    <>
      <div className="header">
        <div className="logo">새로회생</div>
        <h1>개인회생 신청 자격 확인</h1>
        <p>4가지 항목으로 신청 가능 여부를 미리 확인하세요.<br />1~2분이면 완료됩니다.</p>
      </div>

      <div className="card">
        {/* Progress Bar - Only show if not in result state */}
        {!step.startsWith('result') && (
          <div className="progress-wrap">
            <div className="progress-label">
              <span id="stepLabel">
                {step === 'q1' || step === 'q1sub' ? 1 : step === 'q2' ? 2 : step === 'q3' ? 3 : 4} / 4 단계
              </span>
              <span id="stepPct">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* Q1 */}
        {step === 'q1' && (
          <div className="question-block active">
            <div className="q-number">질문 01</div>
            <div className="q-text">과거에 개인파산 또는 개인회생으로<br />빚을 탕감받은 적이 있으신가요?</div>
            <div className="q-desc">💡 법원에서 공식적으로 빚을 면제받은 경험을 말합니다.</div>
            <div className="options">
              <button className="option" onClick={() => goQ2('없음')}>
                <span className="option-icon">①</span> 없습니다
              </button>
              <button className="option" onClick={() => showQ1Sub('p')}>
                <span className="option-icon">②</span> 개인파산 면책을 받은 적 있습니다
              </button>
              <button className="option" onClick={() => showQ1Sub('r')}>
                <span className="option-icon">③</span> 개인회생 인가를 받은 적 있습니다
              </button>
            </div>
          </div>
        )}

        {/* Q1 Sub */}
        {step === 'q1sub' && (
          <div className="question-block active">
            <div className="q-number">
              {q1SubType === 'p' ? '질문 01-1' : '질문 01-2'}
            </div>
            <div className="q-text">
              {q1SubType === 'p' ? '파산 면책을 받은 게 언제인가요?' : '개인회생 인가를 받은 게 언제인가요?'}
            </div>
            <div className="options">
              {q1SubType === 'p' ? (
                <>
                  <button className="option" onClick={() => { setAnswer('q1', '파산면책-7년이상'); goQ2(); }}>
                    <span className="option-icon">①</span> 7년 이상 지났습니다
                  </button>
                  <button className="option" onClick={() => { setAnswer('q1', '파산면책-7년미만'); showResult('ng', 'period'); }}>
                    <span className="option-icon">②</span> 7년이 안 됐습니다
                  </button>
                </>
              ) : (
                <>
                  <button className="option" onClick={() => { setAnswer('q1', '회생인가-5년이상'); goQ2(); }}>
                    <span className="option-icon">①</span> 5년 이상 지났습니다
                  </button>
                  <button className="option" onClick={() => { setAnswer('q1', '회생인가-5년미만'); showResult('ng', 'period'); }}>
                    <span className="option-icon">②</span> 5년이 안 됐습니다
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Q2 */}
        {step === 'q2' && (
          <div className="question-block active">
            <div className="q-number">질문 02</div>
            <div className="q-text">현재 매달 고정적으로<br />들어오는 수입이 있으신가요?</div>
            <div className="q-desc">💡 급여, 연금, 사업소득, 임대료, 가족 생활비 지원 등 모두 포함됩니다.</div>
            <div className="options">
              <button className="option" onClick={() => goQ3('직장인/계약직/공무원')}>
                <span className="option-icon">①</span> 직장인 / 계약직 / 공무원
              </button>
              <button className="option" onClick={() => goQ3('자영업/프리랜서/일용직')}>
                <span className="option-icon">②</span> 자영업 / 프리랜서 / 일용직
              </button>
              <button className="option" onClick={() => goQ3('연금/임대/가족지원')}>
                <span className="option-icon">③</span> 연금 / 임대소득 / 가족 생활비 지원
              </button>
              <button className="option" onClick={() => { setAnswer('q2', '수입없음'); showResult('ng', 'income'); }}>
                <span className="option-icon">④</span> 수입이 없습니다 (무직 / 주부 등)
              </button>
            </div>
          </div>
        )}

        {/* Q3 */}
        {step === 'q3' && (
          <div className="question-block active">
            <div className="q-number">질문 03</div>
            <div className="q-text">현재 총 채무 금액은 얼마인가요?</div>
            <div className="q-desc">💡 카드빚, 대출, 보증채무 등 모두 합산해주세요.</div>
            <div className="options">
              <button className="option" onClick={() => goQ4('3천만~5억')}>
                <span className="option-icon">①</span> 3천만원 이상 ~ 5억원 이하
              </button>
              <button className="option" onClick={() => goQ4('5억~10억')}>
                <span className="option-icon">②</span> 5억원 초과 (담보 포함 10억원 이하)
              </button>
              <button className="option" onClick={() => { setAnswer('q3', '3천만미만'); showResult('ng', 'debt_low'); }}>
                <span className="option-icon">③</span> 3천만원 미만
              </button>
              <button className="option" onClick={() => { setAnswer('q3', '10억초과'); showResult('ng', 'debt_high'); }}>
                <span className="option-icon">④</span> 10억원 초과
              </button>
            </div>
          </div>
        )}

        {/* Q4 */}
        {step === 'q4' && (
          <div className="question-block active">
            <div className="q-number">질문 04</div>
            <div className="q-text">3~5년간 매달 일정 금액을 성실히 갚고,<br />남은 빚을 면제받는 조건으로 진행하실 의향이 있으신가요?</div>
            <div className="q-desc">💡 개인회생은 전액 탕감이 아닌, 일부 변제 후 나머지를 면제받는 제도입니다.</div>
            <div className="options">
              <button className="option" onClick={() => showResult('ok')}>
                <span className="option-icon">①</span> 네, 성실히 변제할 의향이 있습니다
              </button>
              <button className="option" onClick={() => showResult('hold')}>
                <span className="option-icon">②</span> 잘 모르겠습니다, 상담 후 결정하고 싶습니다
              </button>
              <button className="option" onClick={() => showResult('ng', 'will')}>
                <span className="option-icon">③</span> 아니요, 전액 탕감만 원합니다
              </button>
            </div>
          </div>
        )}

        {/* Result: OK */}
        {step === 'result-ok' && (
          <div className="result active">
            <div className="result-icon ok">✅</div>
            <div className="result-badge badge-ok">신청 가능</div>
            <h2>신청 가능성이 확인되었습니다</h2>
            <p>담당자가 30분 이내로 연락드리겠습니다.<br />연락처를 남겨주시면 바로 안내해드립니다.</p>
            <div className="contact-form">
              <label>이름</label>
              <input 
                type="text" 
                placeholder="이름을 입력해주세요" 
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
              />
              <label>연락처</label>
              <input 
                type="tel" 
                placeholder="010-0000-0000" 
                value={contactForm.phone}
                onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
              />
              <button className="btn btn-primary" onClick={() => submitContact('신청가능')}>담당자 연락 요청하기</button>
              {isSending && <div className="sending-msg" style={{display: 'block', fontSize: '13px', color: 'var(--accent)', textAlign: 'center', marginTop: '8px'}}>📤 전송 중...</div>}
            </div>
            <button className="btn btn-reset" onClick={resetForm}>처음부터 다시하기</button>
          </div>
        )}

        {/* Result: NG */}
        {step === 'result-ng' && (
          <div className="result active">
            <div className="result-icon ng">💬</div>
            <div className="result-badge badge-ng">추가 확인 필요</div>
            <h2>
              {ngReason === 'period' && '재신청 가능 기간이 아직 남아있습니다'}
              {ngReason === 'income' && '현재 수입이 없으시면 개인파산이 더 적합합니다'}
              {ngReason === 'debt_low' && '채무 규모에 더 적합한 방법이 있습니다'}
              {ngReason === 'debt_high' && '채무 규모 확인이 필요합니다'}
              {ngReason === 'will' && '개인회생 외 다른 방법을 안내해드립니다'}
            </h2>
            <p>
              {ngReason === 'period' && <>파산은 면책 후 7년, 회생은 인가 후 5년이<br />지나야 재신청이 가능합니다.<br />카카오톡으로 문의주시면 다른 방법을 안내해드립니다.</>}
              {ngReason === 'income' && <>개인회생은 정기적인 수입이 필요한 제도입니다.<br />수입이 없는 경우 개인파산을 통해<br />더 빠르게 해결할 수 있습니다.</>}
              {ngReason === 'debt_low' && <>현재 채무 규모에서는 채무조정이나 워크아웃이<br />더 유리할 수 있습니다.</>}
              {ngReason === 'debt_high' && <>채무 규모가 큰 경우 별도 검토가 필요합니다.<br />카카오톡으로 문의주시면 자세히 안내해드립니다.</>}
              {ngReason === 'will' && <>개인회생은 일부 변제가 필요한 제도입니다.<br />상황에 맞는 다른 해결 방법이 있을 수 있습니다.</>}
              <br />카카오톡으로 문의주시면 안내해드립니다.
            </p>
            <button className="btn btn-kakao" onClick={goKakao}>
              💬 카카오톡으로 무료 문의하기
            </button>
            <button className="btn btn-reset" onClick={resetForm}>처음부터 다시하기</button>
          </div>
        )}

        {/* Result: Hold */}
        {step === 'result-hold' && (
          <div className="result active">
            <div className="result-icon hold">📋</div>
            <div className="result-badge badge-hold">상담 후 결정 가능</div>
            <h2>담당자가 자세히 안내해드립니다</h2>
            <p>변제 조건에 대해 궁금하신 점이 있으시면<br />담당자가 친절하게 설명해드리겠습니다.<br />연락처를 남겨주세요.</p>
            <div className="contact-form">
              <label>이름</label>
              <input 
                type="text" 
                placeholder="이름을 입력해주세요" 
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
              />
              <label>연락처</label>
              <input 
                type="tel" 
                placeholder="010-0000-0000" 
                value={contactForm.phone}
                onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
              />
              <button className="btn btn-primary" onClick={() => submitContact('상담후결정')}>담당자 연락 요청하기</button>
              {isSending && <div className="sending-msg" style={{display: 'block', fontSize: '13px', color: 'var(--accent)', textAlign: 'center', marginTop: '8px'}}>📤 전송 중...</div>}
            </div>
            <button className="btn btn-reset" onClick={resetForm}>처음부터 다시하기</button>
          </div>
        )}

        <div className="notice">
          본 자격 확인은 간단한 사전 안내 목적이며,<br />
          최종 판단은 전문 상담을 통해 이루어집니다.<br />
          입력하신 정보는 상담 외 목적으로 사용되지 않습니다.
        </div>
      </div>
    </>
  );
}
