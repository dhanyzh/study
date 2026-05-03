'use client';
import { useTimer } from '@/hooks/useTimer';

export default function PomodoroPage() {
  const { timeLeft, formattedTime, isRunning, mode, sessions, start, pause, reset } = useTimer();

  return (
    <div className="pomodoro-page">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1>Focus Timer</h1>
        <p className="pomodoro-mode">
          {mode === 'work' ? '🧠 Time to focus' : mode === 'shortBreak' ? '☕ Short Break' : '🎉 Long Break'}
        </p>
      </div>

      <div className="card-glass" style={{ padding: '60px', borderRadius: '50%', border: `4px solid ${mode === 'work' ? 'var(--accent)' : 'var(--success)'}`, boxShadow: '0 0 40px rgba(108,99,255,0.1)' }}>
        <div className="pomodoro-timer">{formattedTime}</div>
      </div>

      <div className="pomodoro-controls" style={{ marginTop: '40px' }}>
        {!isRunning ? (
          <button className="btn btn-primary btn-lg" onClick={start}>▶ Start</button>
        ) : (
          <button className="btn btn-secondary btn-lg" onClick={pause}>⏸ Pause</button>
        )}
        <button className="btn btn-secondary btn-lg" onClick={reset}>↺ Reset</button>
      </div>

      <div className="pomodoro-sessions">
        Completed Pomodoros: <strong>{sessions}</strong>
      </div>
    </div>
  );
}
