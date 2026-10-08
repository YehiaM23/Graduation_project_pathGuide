namespace grad_project.Server.Services;

/// <summary>
/// Guards the unauthenticated CV-parse endpoint. Bounds total OpenAI spend with
/// a process-wide per-minute cap and provides an instant kill-switch, both via
/// config. This is the safety net under the per-IP rate limiter (which alone is
/// spoofable / proxy-coarse).
/// </summary>
public interface IAnonCvParseGate
{
    /// <summary>
    /// Reserves one anonymous parse slot. Returns false if anonymous parsing is
    /// disabled or the global per-minute budget is exhausted (caller should then
    /// degrade gracefully, e.g. return parsed:false).
    /// </summary>
    bool TryEnter();
}

public class AnonCvParseGate : IAnonCvParseGate
{
    private readonly bool _enabled;
    private readonly int _globalPerMinute;
    private readonly TimeProvider _timeProvider;

    private readonly object _lock = new();
    private long _windowStartTicks;
    private int _countInWindow;

    public AnonCvParseGate(IConfiguration configuration, TimeProvider timeProvider)
    {
        _timeProvider = timeProvider;

        // Default ON; set "OpenAi:AnonParseEnabled": false to kill it instantly.
        var enabledValue = configuration["OpenAi:AnonParseEnabled"];
        _enabled = enabledValue == null || (bool.TryParse(enabledValue, out var e) && e);

        // Process-wide ceiling so cost can't run away regardless of IP games.
        _globalPerMinute = int.TryParse(configuration["OpenAi:AnonParseGlobalPerMinute"], out var limit)
            ? limit
            : 30;

        _windowStartTicks = _timeProvider.GetUtcNow().UtcTicks;
    }

    public bool TryEnter()
    {
        if (!_enabled || _globalPerMinute <= 0)
        {
            return false;
        }

        var nowTicks = _timeProvider.GetUtcNow().UtcTicks;
        lock (_lock)
        {
            // Atomic fixed-window rollover + increment (no boundary TOCTOU).
            if (nowTicks - _windowStartTicks >= TimeSpan.TicksPerMinute)
            {
                _windowStartTicks = nowTicks;
                _countInWindow = 0;
            }

            if (_countInWindow >= _globalPerMinute)
            {
                return false;
            }

            _countInWindow++;
            return true;
        }
    }
}
