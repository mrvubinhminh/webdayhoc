import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get, remove } from 'firebase/database';
import { ArrowLeft, Trash2, RefreshCw, ShieldCheck, AlertTriangle, Database } from 'lucide-react';
import { db } from '../firebase';
import { ROOM_NAMESPACES, xetPhong, doiTuoi, coChu, CON_MOI_GIO, QUA_CU_GIO } from '../constants/roomNamespaces';

const CleanupRooms = () => {
  const navigate = useNavigate();
  const [dangQuet, setDangQuet] = useState(false);
  const [dangXoa, setDangXoa] = useState(false);
  const [nhom, setNhom] = useState([]);        // [{ path, label, emoji, rooms: [...] }]
  const [chon, setChon] = useState({});        // { 'rooms/123456': true }
  const [ketQua, setKetQua] = useState(null);
  const [loi, setLoi] = useState('');

  const quet = useCallback(async () => {
    setDangQuet(true);
    setLoi('');
    setKetQua(null);
    try {
      const now = Date.now();
      const ketQuaQuet = [];
      const chonMoi = {};

      for (const ns of ROOM_NAMESPACES) {
        const snap = await get(ref(db, ns.path));
        const val = snap.val() || {};
        const rooms = Object.entries(val).map(([pin, room]) => {
          const danhGia = xetPhong(room, now);
          const bytes = new Blob([JSON.stringify(room)]).size;
          const key = `${ns.path}/${pin}`;
          if (danhGia.rac) chonMoi[key] = true;
          return {
            key, pin, bytes,
            cauHoi: (room?.questions || []).length,
            tenPhong: room?.settings?.gameTitle || '',
            ...danhGia
          };
        }).sort((a, b) => Number(b.rac) - Number(a.rac) || a.pin.localeCompare(b.pin));
        if (rooms.length) ketQuaQuet.push({ ...ns, rooms });
      }

      setNhom(ketQuaQuet);
      setChon(chonMoi);
    } catch (e) {
      console.error(e);
      setLoi('Không đọc được dữ liệu. Kiểm tra lại mạng rồi thử lần nữa.');
    } finally {
      setDangQuet(false);
    }
  }, []);

  useEffect(() => { quet(); }, [quet]);

  const tatCaPhong = nhom.flatMap(g => g.rooms);
  const soDaChon = Object.values(chon).filter(Boolean).length;
  const dungLuongChon = tatCaPhong.filter(r => chon[r.key]).reduce((s, r) => s + r.bytes, 0);
  const soRac = tatCaPhong.filter(r => r.rac).length;
  const dungLuongTong = tatCaPhong.reduce((s, r) => s + r.bytes, 0);

  const doiChon = (key) => setChon(p => ({ ...p, [key]: !p[key] }));
  const chonLaiRac = () => {
    const m = {};
    tatCaPhong.forEach(r => { if (r.rac) m[r.key] = true; });
    setChon(m);
  };
  const boChonHet = () => setChon({});

  const xoa = async () => {
    const danhSach = tatCaPhong.filter(r => chon[r.key]);
    if (danhSach.length === 0) return;

    const dangChay = danhSach.filter(r => !r.rac);
    const canhBao = dangChay.length
      ? `\n\n⚠️ Trong đó có ${dangChay.length} phòng CHƯA chắc là rác (${dangChay.map(r => r.pin).join(', ')}).`
      : '';
    const ok = window.confirm(
      `Xoá hẳn ${danhSach.length} phòng (${coChu(dungLuongChon)})?${canhBao}\n\n` +
      'Toàn bộ câu hỏi và điểm của các phòng này sẽ mất và không lấy lại được.'
    );
    if (!ok) return;

    setDangXoa(true);
    let xong = 0;
    const that_bai = [];
    for (const r of danhSach) {
      try { await remove(ref(db, r.key)); xong++; }
      catch { that_bai.push(r.pin); }
    }
    setDangXoa(false);
    setKetQua({ xong, that_bai, bytes: dungLuongChon });
    quet();
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-20 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" /> Quay lại kho trò chơi
        </button>

        <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2 uppercase tracking-wide">
          🧹 Dọn phòng cũ
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Xoá các phòng đã chơi xong hoặc bỏ quên trên Firebase, để dữ liệu gọn và dễ tìm phòng đang dùng.
        </p>

        {/* Tổng quan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 text-center">
            <Database className="w-6 h-6 text-sky-400 mx-auto mb-1" />
            <div className="text-3xl font-black text-white">{tatCaPhong.length}</div>
            <div className="text-gray-400 text-xs font-bold uppercase">Tổng số phòng</div>
          </div>
          <div className="bg-slate-900/70 border border-red-700/60 rounded-2xl p-4 text-center">
            <Trash2 className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <div className="text-3xl font-black text-red-400">{soRac}</div>
            <div className="text-gray-400 text-xs font-bold uppercase">Phòng rác</div>
          </div>
          <div className="bg-slate-900/70 border border-emerald-700/60 rounded-2xl p-4 text-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <div className="text-3xl font-black text-emerald-400">{tatCaPhong.length - soRac}</div>
            <div className="text-gray-400 text-xs font-bold uppercase">Giữ lại</div>
          </div>
          <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-white">{coChu(dungLuongTong)}</div>
            <div className="text-gray-400 text-xs font-bold uppercase mt-1">Đang chiếm</div>
          </div>
        </div>

        {/* Quy tắc — nói rõ cái gì bị coi là rác */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 mb-6 text-sm">
          <p className="text-gray-300 font-bold mb-2">Phòng bị coi là rác khi:</p>
          <ul className="text-gray-400 list-disc pl-5 space-y-1">
            <li>Đã chơi xong (trạng thái <b>END</b>)</li>
            <li>Mở ra nhưng không có ai vào</li>
            <li>Bỏ quên quá <b>{QUA_CU_GIO} giờ</b></li>
            <li>Tạo từ trước khi phần mềm ghi mốc thời gian</li>
          </ul>
          <p className="text-emerald-400/90 mt-2">
            Phòng có người và mới tạo dưới {CON_MOI_GIO} giờ luôn được giữ — tránh xoá nhầm lớp đang học.
          </p>
        </div>

        {/* Nút thao tác */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={xoa} disabled={soDaChon === 0 || dangXoa || dangQuet}
            className="bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 transition-colors">
            <Trash2 className="w-5 h-5" />
            {dangXoa ? 'Đang xoá…' : `Xoá ${soDaChon} phòng đã chọn (${coChu(dungLuongChon)})`}
          </button>
          <button onClick={chonLaiRac} disabled={dangQuet || dangXoa}
            className="bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold px-5 py-3 rounded-2xl">
            Chọn lại đúng {soRac} phòng rác
          </button>
          <button onClick={boChonHet} disabled={dangQuet || dangXoa}
            className="bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold px-5 py-3 rounded-2xl">
            Bỏ chọn hết
          </button>
          <button onClick={quet} disabled={dangQuet || dangXoa}
            className="bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold px-5 py-3 rounded-2xl flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${dangQuet ? 'animate-spin' : ''}`} /> Quét lại
          </button>
        </div>

        {loi && (
          <div className="bg-red-900/40 border border-red-600 text-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" /> {loi}
          </div>
        )}

        {ketQua && (
          <div className="bg-emerald-900/30 border border-emerald-600 text-emerald-200 rounded-2xl p-4 mb-6">
            ✅ Đã xoá <b>{ketQua.xong}</b> phòng, giải phóng <b>{coChu(ketQua.bytes)}</b>.
            {ketQua.that_bai.length > 0 && (
              <div className="text-amber-300 mt-1">Không xoá được: {ketQua.that_bai.join(', ')}</div>
            )}
          </div>
        )}

        {dangQuet && <p className="text-gray-400 text-center py-10 animate-pulse">Đang quét toàn bộ kho phòng…</p>}

        {!dangQuet && tatCaPhong.length === 0 && (
          <p className="text-emerald-400 text-center py-10 text-xl font-bold">Sạch sẽ! Không có phòng nào trên Firebase.</p>
        )}

        {/* Danh sách theo từng trò chơi */}
        {nhom.map(g => (
          <div key={g.path} className="mb-6 bg-black/30 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-slate-900/70 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-white">{g.emoji} {g.label}</h3>
              <span className="text-gray-400 text-sm font-bold">{g.rooms.length} phòng</span>
            </div>
            <div className="divide-y divide-slate-800">
              {g.rooms.map(r => (
                <label key={r.key}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors ${chon[r.key] ? 'bg-red-950/30' : ''}`}>
                  <input type="checkbox" checked={!!chon[r.key]} onChange={() => doiChon(r.key)}
                    className="w-5 h-5 accent-red-500 cursor-pointer shrink-0" />
                  <span className="font-mono font-black text-lg text-white w-20 shrink-0">{r.pin}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${r.rac ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
                    {r.rac ? 'RÁC' : 'GIỮ'}
                  </span>
                  <span className="flex-1 min-w-0 text-gray-300 text-sm truncate">
                    {r.ly_do}
                    {r.tenPhong && <span className="text-gray-500"> · {r.tenPhong}</span>}
                  </span>
                  <span className="text-gray-500 text-xs shrink-0 hidden sm:block">
                    {r.status} · {r.players} người · {r.cauHoi} câu · {doiTuoi(r.tuoiGio)} · {coChu(r.bytes)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CleanupRooms;
