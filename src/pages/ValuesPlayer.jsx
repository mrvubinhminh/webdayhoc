import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get, update } from 'firebase/database';
import { VALUES, valueOf, DEFAULT_BUDGET, DEFAULT_FLOOR, QUICK_BIDS, bidAmount, rankValues } from '../data/valuesData';

const SESSION_KEY = 'valuesPlayerSession';
const saveSession = (pin, playerId) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ pin, playerId })); } catch { /* bị chặn */ } };
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* không sao */ } };

const TONE = {
  skip: 'bg-slate-700 border-slate-900',
  low:  'bg-emerald-600 border-emerald-800',
  mid:  'bg-sky-600 border-sky-800',
  high: 'bg-orange-600 border-orange-800',
  max:  'bg-red-600 border-red-800',
};

const ValuesPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(() => searchParams.get('pin') || '');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [localGameState, setLocalGameState] = useState('JOIN');
  const [playerId, setPlayerId] = useState('');
  const [step, setStep] = useState(() => searchParams.get('pin') ? 2 : 1);
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [customBid, setCustomBid] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    if ((localGameState === 'PLAYING' || step === 2) && pin) {
      const unsub = onValue(ref(db, `valuesRooms/${pin}`), (snap) => {
        const data = snap.val();
        if (data) setRoomData(data);
        else { clearSession(); alert("Phòng đã đóng!"); navigate('/'); }
      });
      return () => unsub();
    }
  }, [localGameState, step, pin, navigate]);

  useEffect(() => {
    const saved = readSession();
    if (!saved?.pin || !saved?.playerId) return;
    const urlPin = searchParams.get('pin');
    if (urlPin && urlPin !== saved.pin) { clearSession(); return; }
    get(ref(db, `valuesRooms/${saved.pin}/players/${saved.playerId}`)).then(snap => {
      if (!snap.exists()) { clearSession(); return; }
      const p = snap.val();
      setPin(saved.pin); setPlayerId(saved.playerId);
      setName(p.name || ''); setClassName(p.className || '');
      setLocalGameState('PLAYING');
    }).catch(() => {});
  }, []);

  const me = roomData?.players?.[playerId];
  const settings = roomData?.settings || {};
  const budget = settings.budget ?? DEFAULT_BUDGET;
  const floor = settings.floor ?? DEFAULT_FLOOR;
  const remaining = me?.remaining ?? budget;
  const order = roomData?.order || [];
  const roundIndex = roomData?.roundIndex || 0;
  const currentValue = valueOf(order[roundIndex]);
  const myBid = roomData?.bids?.[playerId];
  const hasBid = myBid !== undefined;

  useEffect(() => {
    if (roomData?.status !== 'BIDDING' || !roomData?.roundStartedAt) return;
    setCustomBid('');
    const secs = settings.bidSeconds || 20;
    const tick = () => setTimeLeft(Math.max(0, secs - Math.floor((Date.now() - roomData.roundStartedAt) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.roundStartedAt, settings.bidSeconds]);

  const checkPin = async (e) => {
    e.preventDefault();
    if (!pin) return;
    const snap = await get(ref(db, `valuesRooms/${pin}`));
    if (!snap.exists()) { alert("Mã phòng không hợp lệ!"); return; }
    const data = snap.val();
    setRoomData(data);
    if (data.settings?.defaultClass && !className) setClassName(data.settings.defaultClass);
    setStep(2);
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!name.trim()) { alert("Vui lòng nhập họ tên!"); return; }
    if (!className.trim()) { alert("Vui lòng nhập lớp!"); return; }
    const id = Date.now().toString();
    setPlayerId(id);
    await set(ref(db, `valuesRooms/${pin}/players/${id}`), {
      id, name: name.trim(), className: className.trim().toUpperCase(),
      remaining: roomData?.settings?.budget ?? DEFAULT_BUDGET,
      owned: {}
    });
    saveSession(pin, id);
    setLocalGameState('PLAYING');
  };

  const placeBid = async (amount) => {
    if (busy.current || hasBid || roomData?.status !== 'BIDDING') return;
    const value = Math.max(0, Math.min(remaining, Math.floor(amount) || 0));
    busy.current = true;
    await update(ref(db, `valuesRooms/${pin}`), { [`bids/${playerId}`]: value });
    busy.current = false;
  };

  const myRanked = rankValues(me?.owned || {});
  const spent = budget - remaining;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-4">

      {localGameState === 'JOIN' && step === 1 && (
        <form onSubmit={checkPin} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-amber-700/50">
          <div className="text-6xl mb-3">💎</div>
          <h1 className="text-3xl font-black text-amber-300 mb-1">Đấu Giá Giá Trị Sống</h1>
          <p className="text-gray-400 text-sm mb-6">Điều gì đáng để em trả giá cao nhất?</p>
          <input type="text" placeholder="Mã phòng (PIN)" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-amber-500" />
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-2xl py-4 rounded-xl shadow-[0_10px_0_#92400e] active:translate-y-[10px] active:shadow-none transition-all">
            KẾT NỐI
          </button>
        </form>
      )}

      {localGameState === 'JOIN' && step === 2 && (
        <form onSubmit={joinRoom} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-amber-700/50">
          <h1 className="text-2xl font-black text-white mb-1">Phòng {pin}</h1>
          <p className="text-amber-300 font-bold mb-6">Ghi đúng tên để nhận bảng giá trị của mình</p>
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Họ và tên</label>
          <input type="text" placeholder="Nguyễn Văn An" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-amber-500" />
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Lớp</label>
          <input type="text" placeholder="11A3" value={className} onChange={(e) => setClassName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-6 outline-none border-4 border-transparent focus:border-amber-500" />
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
            💎 VÀO SÀN
          </button>
        </form>
      )}

      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full max-w-md flex flex-col items-center">

          {roomData.status === 'LOBBY' && (
            <div className="text-center">
              <div className="text-7xl mb-3">💎</div>
              <h2 className="text-2xl font-bold text-white">Chào {me?.name || name}!</h2>
              <p className="text-amber-300 font-bold mt-1">{me?.className || className}</p>
              <div className="bg-amber-500/15 border-2 border-amber-500 rounded-2xl px-8 py-5 my-5">
                <p className="text-amber-200 text-xs uppercase tracking-widest font-bold">Ngân sách của em</p>
                <p className="text-5xl font-black text-white mt-1">{remaining}</p>
                <p className="text-white/70 text-sm mt-2">{order.length} giá trị sẽ lần lượt lên sàn</p>
              </div>
              <p className="text-gray-400">Chờ thầy cô mở phiên…</p>
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mt-5" />
            </div>
          )}

          {/* --- Đang đấu giá --- */}
          {roomData.status === 'BIDDING' && currentValue && (
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-600 text-amber-200 font-black text-sm">
                  Lượt {roundIndex + 1}/{order.length}
                </div>
                <div className={`ml-auto px-4 py-1.5 rounded-full font-black text-lg border ${timeLeft <= 5 ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse' : 'bg-slate-800 border-slate-700 text-white'}`}>
                  ⏱ {timeLeft}s
                </div>
              </div>

              {/* Ngân sách */}
              <div className="bg-black/50 border-2 border-amber-600 rounded-2xl px-5 py-3 text-center">
                <p className="text-amber-300 text-xs uppercase tracking-widest font-bold">Ngân sách còn lại</p>
                <p className="text-4xl font-black text-white">{remaining}</p>
                {spent > 0 && <p className="text-gray-400 text-xs mt-0.5">đã tiêu {spent} / {budget}</p>}
              </div>

              {/* Giá trị đang lên sàn */}
              <div className="rounded-3xl border-4 p-6 text-center"
                style={{ backgroundColor: currentValue.color + '25', borderColor: currentValue.color }}>
                <div className="text-7xl mb-1">{currentValue.emoji}</div>
                <h2 className="text-3xl font-black text-white">{currentValue.name}</h2>
                <p className="text-white/85 mt-2 text-sm leading-relaxed">{currentValue.desc}</p>
                <p className="mt-3 inline-block px-4 py-1.5 rounded-full font-black text-sm bg-black/40 text-white">
                  Giá sàn {floor} điểm
                </p>
              </div>

              {hasBid ? (
                <div className="bg-emerald-500/20 border-2 border-emerald-500 rounded-3xl px-6 py-7 text-center">
                  <div className="text-5xl mb-1">🔨</div>
                  <p className="text-emerald-300 font-bold uppercase text-sm tracking-widest">Em đã chốt giá</p>
                  <p className="text-5xl font-black text-white mt-1">{myBid}</p>
                  <p className="text-white/80 font-bold mt-2 text-sm">
                    {myBid >= floor ? '✅ Đủ giá sàn — em sẽ sở hữu giá trị này' : '⚠️ Dưới giá sàn — không mua được nhưng không mất tiền'}
                  </p>
                </div>
              ) : remaining <= 0 ? (
                <div className="bg-slate-800 border-2 border-slate-600 rounded-3xl px-6 py-8 text-center">
                  <div className="text-5xl mb-2">💸</div>
                  <p className="text-gray-300 font-black text-lg">Em đã tiêu hết ngân sách</p>
                  <p className="text-gray-500 text-sm mt-2">Giờ chỉ còn biết đứng nhìn thôi… Lần sau cân nhắc kỹ hơn nhé!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    {QUICK_BIDS.map(q => {
                      const amt = q.pct === 0 ? 0 : bidAmount(remaining, q.pct);
                      const tooLow = q.pct !== 0 && amt < floor;
                      return (
                        <button key={q.pct} onClick={() => placeBid(amt)}
                          className={`${TONE[q.tone]} border-b-[6px] rounded-2xl py-4 px-3 active:translate-y-1 active:border-b-0 transition-all ${q.pct === 100 ? 'col-span-2' : ''}`}>
                          <div className="font-black text-white text-lg">{q.label}</div>
                          <div className="text-white/85 text-xs font-bold">{q.sub}</div>
                          <div className="font-black text-white text-2xl mt-1">
                            {q.pct === 0 ? '—' : amt}
                            {tooLow && <span className="block text-[11px] font-bold text-white/80">dưới giá sàn</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tự nhập con số cho em nào muốn tính kỹ */}
                  <div className="flex gap-2">
                    <input type="number" min="0" max={remaining} value={customBid}
                      onChange={(e) => setCustomBid(e.target.value)}
                      placeholder="hoặc tự nhập số điểm…"
                      className="flex-1 bg-slate-900 border-2 border-slate-700 text-white text-center text-xl font-black py-3 rounded-xl outline-none focus:border-amber-500" />
                    <button onClick={() => { const n = parseInt(customBid); if (n >= 0) placeBid(n); }}
                      disabled={customBid === '' || parseInt(customBid) < 0}
                      className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 rounded-xl font-black">
                      Chốt
                    </button>
                  </div>

                  <p className="text-center text-gray-500 text-xs">
                    Thứ tự các giá trị là ngẫu nhiên — dốc hết bây giờ thì về sau không còn gì để trả
                  </p>
                </>
              )}
            </div>
          )}

          {/* --- Chờ sang lượt mới --- */}
          {roomData.status === 'RESULT' && roomData.lastResult && (() => {
            const r = roomData.lastResult;
            const v = valueOf(r.valueId);
            const myPaid = me?.owned?.[r.valueId] || 0;
            return (
              <div className="w-full flex flex-col gap-3 text-center">
                <div className={`rounded-3xl p-6 border-4 ${myPaid > 0 ? 'bg-emerald-900/60 border-emerald-400' : 'bg-slate-800/80 border-slate-600'}`}>
                  <div className="text-6xl">{myPaid > 0 ? '🎉' : '😐'}</div>
                  <p className="text-white/80 text-sm font-bold mt-2">{v?.emoji} {v?.name}</p>
                  <h2 className="text-2xl font-black text-white mt-1">
                    {myPaid > 0 ? `Em đã mua được với ${myPaid} điểm!` : 'Em bỏ qua giá trị này'}
                  </h2>
                  <p className="text-white/70 text-sm mt-2">{r.buyers}/{r.total} bạn trong lớp chịu bỏ tiền mua ({r.demand}%)</p>
                  {r.topName && <p className="text-yellow-300 font-bold text-sm mt-1">Trả cao nhất: {r.topName} — {r.topAmount} điểm</p>}
                </div>

                <div className="bg-black/50 border-2 border-amber-600 rounded-2xl px-5 py-3">
                  <p className="text-amber-300 text-xs uppercase tracking-widest font-bold">Ngân sách còn lại</p>
                  <p className="text-3xl font-black text-white">{remaining}</p>
                </div>

                {myRanked.length > 0 && (
                  <div className="bg-black/40 rounded-2xl border border-white/15 p-3">
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Em đang sở hữu</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {myRanked.map(x => (
                        <span key={x.value.id} className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: x.value.color + '30', color: x.value.color }}>
                          {x.value.emoji} {x.value.name} · {x.paid}đ
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-gray-400 text-sm animate-pulse">Chờ thầy cô mở giá trị tiếp theo…</p>
              </div>
            );
          })()}

          {/* --- Tổng kết --- */}
          {roomData.status === 'END' && (
            <div className="w-full flex flex-col items-center gap-4 text-center py-3">
              <div className="text-6xl">💎</div>
              <h1 className="text-2xl font-black text-amber-300">Bảng giá trị của {me?.name}</h1>
              <p className="text-gray-400 text-sm -mt-2">Xếp theo số điểm em đã sẵn sàng bỏ ra</p>

              {myRanked.length > 0 ? (
                <div className="w-full flex flex-col gap-2">
                  {myRanked.map((x, i) => (
                    <div key={x.value.id} className="flex items-center gap-3 rounded-2xl p-3.5 text-left"
                      style={{ backgroundColor: x.value.color + '20', border: `2px solid ${x.value.color}77` }}>
                      <span className="font-black text-gray-400 w-5 shrink-0">{i + 1}</span>
                      <span className="text-2xl shrink-0">{x.value.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-white">{x.value.name}</div>
                        <div className="text-gray-400 text-xs leading-snug">{x.value.desc}</div>
                      </div>
                      <span className="font-black text-lg shrink-0" style={{ color: x.value.color }}>{x.paid}đ</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800 rounded-2xl px-6 py-8">
                  <p className="text-gray-300 font-bold">Em chưa mua được giá trị nào</p>
                  <p className="text-gray-500 text-sm mt-1">Lần sau mạnh dạn trả giá hơn nhé!</p>
                </div>
              )}

              <div className="w-full bg-black/40 rounded-2xl border border-white/15 px-5 py-3">
                <p className="text-gray-400 text-sm">Đã tiêu <b className="text-amber-300">{spent}</b> / {budget} điểm · còn lại <b className="text-white">{remaining}</b></p>
              </div>

              {myRanked[0] && (
                <div className="w-full bg-amber-500/15 border-2 border-amber-500 rounded-2xl px-5 py-4">
                  <p className="text-amber-200 text-xs uppercase tracking-widest font-bold">Điều em coi trọng nhất</p>
                  <p className="text-2xl font-black text-white mt-1">{myRanked[0].value.emoji} {myRanked[0].value.name}</p>
                </div>
              )}

              <p className="text-gray-400 text-sm px-2 leading-relaxed">
                Bảng này có giống điều em vẫn nghĩ về mình không?
                Hãy nhớ nó khi chọn ngành, chọn nghề sau này nhé 🌱
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValuesPlayer;
