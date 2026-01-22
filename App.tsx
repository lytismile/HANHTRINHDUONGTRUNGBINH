
import React, { useState, useEffect } from 'react';
import { GameState, Question, Achievement, LeaderboardEntry } from './types';
import { generateMathQuestions, DEFAULT_QUESTIONS } from './services/geminiService';
import TriangleGeometry from './components/TriangleGeometry';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'Người Khởi Đầu', icon: '🌱', unlocked: false },
  { id: 'perfect_score', title: 'Thánh Hình Học', icon: '🏆', unlocked: false },
  { id: 'pro_math', title: 'Siêu Cấp Vip Pro', icon: '💎', unlocked: false },
];

const MAX_LIVES = 3;
const LEADERBOARD_KEY = 'math_arena_leaderboard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [playerName, setPlayerName] = useState('');
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, message: string } | null>(null);
  const [pointPop, setPointPop] = useState<{ value: string, color: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    }

    const prefetch = async () => {
      try {
        const freshQuestions = await generateMathQuestions('medium');
        if (freshQuestions && freshQuestions.length >= 5) {
          setQuestions(freshQuestions);
        }
      } catch (e) {
        console.warn("Background prefetch failed, using defaults.");
      }
    };
    prefetch();
  }, []);

  const saveToLeaderboard = (finalScore: number) => {
    if (!playerName.trim()) return;
    const newEntry: LeaderboardEntry = {
      name: playerName.trim(),
      score: finalScore,
      date: new Date().toLocaleDateString('vi-VN')
    };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
  };

  const startNewGame = async (difficulty: 'easy' | 'medium' | 'hard', skipFetch: boolean = false) => {
    setScore(0);
    setLives(MAX_LIVES);
    setCurrentQuestionIdx(0);
    setFeedback(null);
    setPointPop(null);
    
    if (skipFetch) {
      setGameState(GameState.PLAYING);
      return;
    }

    setLoading(true);
    setGameState(GameState.PLAYING);
    try {
      const data = await generateMathQuestions(difficulty);
      if (data && data.length > 0) {
        setQuestions(data);
      }
    } catch (error) {
      console.error("Game fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (feedback) return;

    const isCorrect = idx === questions[currentQuestionIdx].correctAnswer;
    if (isCorrect) {
      setScore(s => s + 10);
      setPointPop({ value: '+10', color: 'text-green-500' });
    } else {
      setScore(s => Math.max(0, s - 5)); 
      setLives(l => l - 1);
      setPointPop({ value: '-5 💔', color: 'text-red-500' });
    }

    setFeedback({
      isCorrect,
      message: isCorrect ? "TUYỆT VỜI! Bạn đã cộng thêm 10 điểm." : `SAI RỒI! Bạn bị trừ 5 điểm và mất 1 mạng. ${questions[currentQuestionIdx].explanation}`
    });

    setTimeout(() => setPointPop(null), 1000);
  };

  const nextQuestion = () => {
    if (lives <= 0 && (!feedback || !feedback.isCorrect)) {
      saveToLeaderboard(score);
      setGameState(GameState.GAME_OVER);
      return;
    }

    setFeedback(null);
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(idx => idx + 1);
    } else {
      saveToLeaderboard(score);
      setGameState(GameState.SUMMARY);
      checkAchievements();
    }
  };

  const checkAchievements = () => {
    setAchievements(prev => prev.map(a => {
      if (a.id === 'first_win' && score > 0) return { ...a, unlocked: true };
      if (a.id === 'perfect_score' && score === questions.length * 10) return { ...a, unlocked: true };
      if (a.id === 'pro_math' && score >= 80) return { ...a, unlocked: true };
      return a;
    }));
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 animate-fade-in">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-700 p-14 rounded-[3rem] shadow-[0_20px_50px_rgba(37,99,235,0.4)] relative transform -rotate-3 hover:rotate-0 transition-transform duration-500">
          <i className="fas fa-shapes text-white text-8xl"></i>
          <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-blue-900 text-sm px-4 py-2 rounded-2xl font-black border-4 border-white shadow-lg animate-bounce">TOP 1 LỚP 8</div>
        </div>
      </div>
      
      <h1 className="text-7xl font-black text-slate-900 mb-2 tracking-tighter italic">MATH<span className="text-blue-600">ARENA</span></h1>
      <p className="text-slate-400 font-bold uppercase tracking-[0.3em] mb-12">Chinh phục đường trung bình</p>
      
      <div className="flex flex-col gap-5 w-full max-w-sm">
        <button 
          onClick={() => playerName ? startNewGame('medium', true) : setGameState(GameState.NAME_INPUT)}
          className="group relative overflow-hidden bg-blue-600 text-white py-7 rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl font-black text-3xl transform hover:scale-105 active:scale-95 border-b-[12px] border-blue-900"
        >
          <span className="relative z-10 flex items-center justify-center">
            {playerName ? 'VÀO TRẬN' : 'BẮT ĐẦU'} <i className={`fas ${playerName ? 'fa-swords' : 'fa-play-circle'} ml-3`}></i>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setGameState(GameState.LEARNING)}
            className="bg-white border-4 border-slate-100 text-slate-700 py-5 rounded-[1.5rem] hover:border-blue-500 hover:text-blue-600 transition shadow-lg font-black text-sm uppercase flex items-center justify-center group"
          >
            <i className="fas fa-book-open mr-2 group-hover:rotate-12 transition-transform"></i> Lý thuyết
          </button>
          <button 
            onClick={() => {
              if (leaderboard.length > 0) setGameState(GameState.SUMMARY);
              else alert("Chưa có kỷ lục nào được ghi nhận!");
            }}
            className="bg-white border-4 border-slate-100 text-slate-700 py-5 rounded-[1.5rem] hover:border-yellow-500 hover:text-yellow-600 transition shadow-lg font-black text-sm uppercase flex items-center justify-center group"
          >
            <i className="fas fa-trophy mr-2 group-hover:scale-125 transition-transform"></i> Xếp hạng
          </button>
        </div>
      </div>
    </div>
  );

  const renderNameInput = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 animate-slide-up">
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-lg border-8 border-blue-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-4 bg-blue-600"></div>
        <h2 className="text-4xl font-black text-slate-900 mb-8 italic">ĐĂNG KÝ CHIẾN BINH</h2>
        <div className="mb-10 text-left">
          <label className="block text-slate-400 font-black text-xs uppercase tracking-widest mb-4 ml-4">Họ và tên học sinh</label>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            className="w-full bg-slate-50 border-4 border-slate-100 rounded-3xl px-8 py-5 text-2xl font-black text-slate-800 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
            autoFocus
            onKeyDown={(e) => { if(e.key === 'Enter' && playerName.trim()) startNewGame('medium', true); }}
          />
        </div>
        <button 
          onClick={() => playerName.trim() && startNewGame('medium', true)}
          disabled={!playerName.trim()}
          className={`w-full py-6 rounded-[2rem] font-black text-2xl transition-all shadow-xl border-b-[12px] ${
            playerName.trim() 
              ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-900 active:translate-y-2 active:border-b-[4px]' 
              : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
          }`}
        >
          XÁC NHẬN & VÀO TRẬN <i className="fas fa-check-circle ml-2"></i>
        </button>
      </div>
    </div>
  );

  const renderLearning = () => (
    <div className="max-w-5xl mx-auto p-6 animate-slide-up">
      <button onClick={() => setGameState(GameState.HOME)} className="bg-white p-4 rounded-2xl shadow-sm text-blue-600 mb-8 font-black uppercase text-xs flex items-center hover:bg-blue-50 transition-colors border border-slate-100">
        <i className="fas fa-arrow-left mr-2"></i> Trở về sảnh
      </button>
      
      <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-16 mb-8 border border-slate-50 relative">
        <h2 className="text-5xl font-black text-slate-900 mb-12 italic border-l-8 border-blue-600 pl-6">Bí kíp Hình Học 8</h2>
        
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <section className="bg-blue-50/50 p-8 rounded-[2rem] border-2 border-blue-100 relative group overflow-hidden">
               <h3 className="text-2xl font-black text-blue-700 mb-4 uppercase flex items-center">
                 <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center mr-3 text-lg">1</span>
                 Định nghĩa
               </h3>
               <p className="text-slate-800 text-xl font-bold leading-relaxed">
                 Đường trung bình của tam giác là đoạn thẳng nối <strong>trung điểm hai cạnh</strong> của tam giác đó.
               </p>
            </section>

            <section className="bg-emerald-50/50 p-8 rounded-[2rem] border-2 border-emerald-100 relative group overflow-hidden">
               <h3 className="text-2xl font-black text-emerald-700 mb-4 uppercase flex items-center">
                 <span className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center mr-3 text-lg">2</span>
                 Tính chất (Định lý 2)
               </h3>
               <div className="space-y-4">
                  <div className="flex items-center bg-white p-4 rounded-2xl shadow-sm">
                    <i className="fas fa-arrows-left-right text-emerald-500 mr-4"></i>
                    <span className="text-slate-800 font-black text-lg italic uppercase">Song song với cạnh thứ ba</span>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-2xl shadow-sm">
                    <i className="fas fa-scissors text-emerald-500 mr-4"></i>
                    <span className="text-slate-800 font-black text-lg italic uppercase">Bằng nửa cạnh thứ ba</span>
                  </div>
               </div>
            </section>

            <section className="bg-amber-50/50 p-8 rounded-[2rem] border-2 border-amber-100 relative group overflow-hidden">
               <h3 className="text-2xl font-black text-amber-700 mb-4 uppercase flex items-center">
                 <span className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center mr-3 text-lg">3</span>
                 Định lý 1 (Đảo)
               </h3>
               <p className="text-slate-800 text-xl font-bold leading-relaxed">
                 Đường thẳng đi qua <strong>trung điểm một cạnh</strong> và <strong>song song</strong> cạnh thứ hai thì đi qua <strong>trung điểm cạnh thứ ba</strong>.
               </p>
            </section>
          </div>

          <div className="lg:sticky lg:top-24">
            <div className="bg-slate-50 rounded-[4rem] p-12 border-8 border-white shadow-2xl flex flex-col items-center">
              <TriangleGeometry width={400} height={300} showLabels={true} />
              <div className="mt-8 bg-white px-6 py-4 rounded-2xl shadow-sm text-center">
                 <p className="text-blue-600 font-black uppercase text-xs tracking-widest mb-1">Mẫu minh họa</p>
                 <p className="text-slate-500 font-bold">M, N là trung điểm ⇒ MN là đường trung bình</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pb-12">
        <button 
          onClick={() => playerName ? startNewGame('medium', true) : setGameState(GameState.NAME_INPUT)}
          className="bg-indigo-600 text-white px-20 py-8 rounded-[2.5rem] hover:bg-indigo-700 transition shadow-2xl font-black text-4xl transform hover:scale-105 active:scale-95 border-b-[16px] border-indigo-900"
        >
          {playerName ? 'CHIẾN NGAY' : 'BẮT ĐẦU'} <i className="fas fa-bolt ml-3 text-yellow-300"></i>
        </button>
      </div>
    </div>
  );

  const renderPlaying = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-[12px] border-slate-100 border-t-blue-600"></div>
          <i className="fas fa-robot absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 text-4xl"></i>
        </div>
        <p className="mt-12 text-slate-800 font-black text-3xl uppercase">Đang xây dựng mô hình...</p>
      </div>
    );

    const q = questions[currentQuestionIdx];
    if (!q) return null;

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center space-x-3 bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
            {questions.map((_, i) => (
              <div 
                key={i} 
                className={`h-5 w-5 rounded-full transition-all duration-500 ${
                  i === currentQuestionIdx ? 'bg-blue-600 ring-8 ring-blue-100 scale-125' : i < currentQuestionIdx ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="bg-white px-8 py-4 rounded-3xl shadow-xl flex items-center border-4 border-slate-50 min-w-[140px] justify-center relative">
              <i className="fas fa-heart text-red-500 mr-3 text-2xl animate-pulse"></i>
              <span className="text-3xl font-black tabular-nums text-slate-800">{lives}</span>
            </div>
            <div className="relative">
              <div className="bg-slate-900 text-white px-10 py-4 rounded-3xl shadow-2xl flex items-center border-4 border-slate-800 min-w-[180px] justify-center">
                <i className="fas fa-star text-yellow-400 mr-3 text-2xl"></i>
                <span className="text-3xl font-black tabular-nums">{score}</span>
              </div>
              {pointPop && (
                <div className={`absolute -top-16 left-1/2 -translate-x-1/2 font-black text-5xl animate-bounce-short ${pointPop.color} drop-shadow-lg`}>
                  {pointPop.value}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-50 relative group">
          <div className="p-8 md:p-16">
            <div className="flex items-center justify-between mb-12 text-slate-400 font-black">
               <span className="bg-blue-600 text-white px-6 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg">
                 Câu {currentQuestionIdx + 1}
               </span>
               <span className="flex items-center uppercase tracking-widest text-xs">
                 <i className="fas fa-user-circle mr-2 text-blue-500"></i> {playerName}
               </span>
               <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-10 max-w-[200px]">
                 <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}></div>
               </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-16 leading-snug">
              {q.question}
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-5">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={!!feedback}
                    onClick={() => handleAnswer(i)}
                    className={`w-full text-left p-8 rounded-[2.5rem] border-4 transition-all group relative overflow-hidden ${
                      feedback 
                        ? i === q.correctAnswer 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-[0_0_40px_rgba(16,185,129,0.3)] scale-105 z-10' 
                          : (feedback.isCorrect === false && i === questions[currentQuestionIdx].correctAnswer) ? 'bg-emerald-50 border-emerald-500 opacity-60' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-40'
                        : 'bg-white border-slate-100 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:translate-x-4 hover:shadow-2xl'
                    }`}
                  >
                    <div className="flex items-center relative z-10">
                      <span className={`inline-flex w-14 h-14 shrink-0 rounded-3xl items-center justify-center mr-6 font-black text-2xl transition-all ${
                         feedback 
                          ? i === q.correctAnswer ? 'bg-emerald-500 text-white rotate-12 scale-110' : 'bg-slate-200 text-slate-400'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:-rotate-6 shadow-sm'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-2xl font-bold">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex flex-col items-center">
                <TriangleGeometry 
                  width={420} 
                  height={320} 
                  // CHỈ hiển thị số độ dài KHI ĐÃ TRẢ LỜI XONG (để tránh hiện đáp án trước khi chọn)
                  baseLength={feedback ? q.triangleParams?.baseLength : undefined} 
                  midsegmentLength={feedback ? q.triangleParams?.midsegmentLength : undefined} 
                  labels={q.triangleParams?.labels}
                />
                <p className="mt-6 text-slate-400 text-xs font-black uppercase tracking-widest italic">
                   {feedback ? "Dữ liệu độ dài đã hiển thị" : "Độ dài bị ẩn để tăng thử thách"}
                </p>
              </div>
            </div>
          </div>

          {feedback && (
            <div className={`p-12 animate-slide-up flex flex-col md:flex-row items-center justify-between gap-10 ${feedback.isCorrect ? 'bg-emerald-600' : 'bg-red-600'} text-white relative z-20`}>
              <div className="flex items-center gap-8">
                <div className="bg-white/20 p-6 rounded-[2.5rem] shadow-xl backdrop-blur-md">
                  <i className={`fas ${feedback.isCorrect ? 'fa-bolt' : 'fa-skull'} text-5xl animate-bounce`}></i>
                </div>
                <div>
                  <h4 className="font-black text-4xl mb-2 italic uppercase tracking-tighter">
                    {feedback.isCorrect ? "CHÍNH XÁC!" : "CỐ GẮNG LÊN!"}
                  </h4>
                  <p className="text-white/90 text-xl max-w-2xl font-bold leading-tight">
                    {feedback.message}
                  </p>
                </div>
              </div>
              <button 
                onClick={nextQuestion}
                className="bg-white text-slate-900 px-16 py-7 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-slate-50 transition transform active:scale-90 whitespace-nowrap border-b-8 border-slate-200"
              >
                {currentQuestionIdx === questions.length - 1 ? 'KẾT THÚC' : 'CÂU TIẾP'} <i className="fas fa-chevron-right ml-3"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div className="mt-12 w-full">
      <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center justify-center">
        <i className="fas fa-list-ol mr-3 text-yellow-500"></i> Bảng Xếp Hạng Top 10
      </h3>
      <div className="bg-white/50 backdrop-blur rounded-[3rem] overflow-hidden border-4 border-white shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white font-black uppercase text-xs tracking-widest">
            <tr>
              <th className="px-8 py-4">Hạng</th>
              <th className="px-8 py-4">Học Sinh</th>
              <th className="px-8 py-4 text-center">Điểm Số</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
            {leaderboard.map((entry, i) => (
              <tr key={i} className={`transition-colors ${entry.name === playerName ? 'bg-blue-50/50' : 'hover:bg-white/80'}`}>
                <td className="px-8 py-5">#{i + 1}</td>
                <td className="px-8 py-5">{entry.name}</td>
                <td className="px-8 py-5 text-center text-blue-600 font-black text-xl">{entry.score}</td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={3} className="px-8 py-10 text-center text-slate-300 italic">Chưa có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 animate-fade-in">
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-16 rounded-full mb-12 shadow-[0_25px_60px_rgba(234,179,8,0.5)] relative">
        <i className="fas fa-crown text-white text-9xl"></i>
        <div className="absolute inset-0 animate-ping bg-yellow-400 rounded-full opacity-20"></div>
      </div>
      
      <h2 className="text-7xl font-black text-slate-900 mb-2 uppercase italic">HOÀN TẤT!</h2>
      <p className="text-slate-400 mb-12 text-2xl font-black uppercase tracking-[0.3em]"><span className="text-blue-600">{playerName}</span> đã thắng lợi!</p>
      
      <div className="bg-white p-14 rounded-[5rem] shadow-2xl w-full max-w-xl mb-12 border-8 border-white relative">
        <div className="text-[10rem] font-black text-blue-600 mb-2 tabular-nums drop-shadow-2xl leading-none">{score}</div>
        <div className="text-slate-400 uppercase tracking-widest font-black text-lg mb-12">Điểm vinh quang</div>
      </div>

      {renderLeaderboard()}

      <div className="flex flex-col sm:flex-row gap-8 w-full max-w-xl mt-12">
        <button 
          onClick={() => setGameState(GameState.HOME)}
          className="flex-1 bg-white text-slate-600 px-12 py-7 rounded-[2rem] hover:bg-slate-50 transition font-black text-2xl uppercase border-b-[12px] border-slate-200 shadow-xl"
        >
          SẢNH CHÍNH
        </button>
        <button 
          onClick={() => startNewGame('hard', true)}
          className="flex-1 bg-blue-600 text-white px-12 py-7 rounded-[2rem] hover:bg-blue-700 transition shadow-2xl font-black text-2xl uppercase border-b-[12px] border-blue-900 transform hover:-translate-y-3"
        >
          TÁI ĐẤU <i className="fas fa-redo-alt ml-3"></i>
        </button>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 animate-shake">
      <div className="bg-gradient-to-br from-red-500 to-red-800 p-16 rounded-full mb-12 shadow-[0_25px_60px_rgba(220,38,38,0.5)]">
        <i className="fas fa-skull-crossbones text-white text-9xl"></i>
      </div>
      <h2 className="text-7xl font-black text-slate-900 mb-2 uppercase italic">THẤT BẠI!</h2>
      <div className="bg-white p-14 rounded-[5rem] shadow-2xl w-full max-w-xl mb-12 border-8 border-red-50 relative">
        <div className="text-[10rem] font-black text-red-600 mb-2 leading-none">{score}</div>
      </div>
      {renderLeaderboard()}
      <div className="flex flex-col sm:flex-row gap-8 w-full max-w-xl mt-12">
        <button 
          onClick={() => setGameState(GameState.LEARNING)}
          className="flex-1 bg-white text-slate-600 px-12 py-7 rounded-[2rem] hover:bg-slate-50 transition font-black text-2xl uppercase border-b-[12px] border-slate-200"
        >
          ÔN TẬP
        </button>
        <button 
          onClick={() => startNewGame('easy', true)}
          className="flex-1 bg-red-600 text-white px-12 py-7 rounded-[2rem] hover:bg-red-700 transition shadow-2xl font-black text-2xl uppercase border-b-[12px] border-red-900"
        >
          THỬ LẠI <i className="fas fa-sync ml-3"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Quicksand']">
      <nav className="glass-morphism sticky top-0 z-50 px-8 py-6 border-b-8 border-slate-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => setGameState(GameState.HOME)}>
            <div className="bg-slate-950 p-3 rounded-[1.25rem] shadow-2xl group-hover:rotate-12 transition-all">
              <i className="fas fa-shapes text-blue-400 text-2xl"></i>
            </div>
            <span className="text-3xl font-black text-slate-950 tracking-tighter italic uppercase">MATH<span className="text-blue-600">ARENA</span></span>
          </div>
          <div className="flex items-center space-x-6">
             {playerName && (
               <div className="hidden sm:flex bg-blue-600 text-white px-5 py-2 rounded-2xl text-xs font-black items-center shadow-lg uppercase">
                 <i className="fas fa-user-circle mr-2"></i> {playerName}
               </div>
             )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-32">
        {gameState === GameState.HOME && renderHome()}
        {gameState === GameState.NAME_INPUT && renderNameInput()}
        {gameState === GameState.LEARNING && renderLearning()}
        {gameState === GameState.PLAYING && renderPlaying()}
        {gameState === GameState.SUMMARY && renderSummary()}
        {gameState === GameState.GAME_OVER && renderGameOver()}
      </main>

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translate(-50%, 0); opacity: 1; }
          50% { transform: translate(-50%, -40px); opacity: 0.8; }
        }
        .animate-bounce-short {
          animation: bounce-short 1.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.6s cubic-bezier(0.2, 1, 0.3, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default App;
