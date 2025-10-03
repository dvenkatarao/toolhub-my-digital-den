import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Timer, Hourglass, Play, Pause, RotateCcw, Plus, Trash2, Globe, AlarmClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClocksTimers() {
  const { toast } = useToast();

  // World Clock States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimezones, setSelectedTimezones] = useState([
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Australia/Sydney',
  ]);

  // Stopwatch States
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const stopwatchInterval = useRef<NodeJS.Timeout | null>(null);

  // Timer States
  const [timerMinutes, setTimerMinutes] = useState('5');
  const [timerSeconds, setTimerSeconds] = useState('0');
  const [timerTime, setTimerTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInitial, setTimerInitial] = useState(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Pomodoro States
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const pomodoroInterval = useRef<NodeJS.Timeout | null>(null);

  // Alarm States
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmLabel, setAlarmLabel] = useState('');
  const [alarms, setAlarms] = useState<{ id: string; time: string; label: string; enabled: boolean }[]>([]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stopwatch logic
  useEffect(() => {
    if (stopwatchRunning) {
      stopwatchInterval.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 10);
      }, 10);
    } else if (stopwatchInterval.current) {
      clearInterval(stopwatchInterval.current);
    }
    return () => {
      if (stopwatchInterval.current) clearInterval(stopwatchInterval.current);
    };
  }, [stopwatchRunning]);

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerTime > 0) {
      timerInterval.current = setInterval(() => {
        setTimerTime((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            toast({
              title: "Timer Complete!",
              description: "Your countdown has finished",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [timerRunning, timerTime]);

  // Pomodoro logic
  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      pomodoroInterval.current = setInterval(() => {
        setPomodoroTime((prev) => {
          if (prev <= 1) {
            setPomodoroRunning(false);
            if (pomodoroMode === 'work') {
              setPomodoroMode('break');
              setPomodoroTime(5 * 60);
              setPomodoroSessions((prev) => prev + 1);
              toast({
                title: "Work Session Complete!",
                description: "Time for a break",
              });
            } else {
              setPomodoroMode('work');
              setPomodoroTime(25 * 60);
              toast({
                title: "Break Complete!",
                description: "Time to get back to work",
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (pomodoroInterval.current) {
      clearInterval(pomodoroInterval.current);
    }
    return () => {
      if (pomodoroInterval.current) clearInterval(pomodoroInterval.current);
    };
  }, [pomodoroRunning, pomodoroTime, pomodoroMode]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeInTimezone = (timezone: string) => {
    return currentTime.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getDateInTimezone = (timezone: string) => {
    return currentTime.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleStopwatchToggle = () => {
    setStopwatchRunning(!stopwatchRunning);
  };

  const handleStopwatchReset = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    setLaps([stopwatchTime, ...laps]);
  };

  const handleTimerStart = () => {
    const totalSeconds = parseInt(timerMinutes) * 60 + parseInt(timerSeconds);
    if (totalSeconds > 0) {
      setTimerTime(totalSeconds);
      setTimerInitial(totalSeconds);
      setTimerRunning(true);
    }
  };

  const handleTimerToggle = () => {
    setTimerRunning(!timerRunning);
  };

  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimerTime(timerInitial);
  };

  const handlePomodoroToggle = () => {
    setPomodoroRunning(!pomodoroRunning);
  };

  const handlePomodoroReset = () => {
    setPomodoroRunning(false);
    setPomodoroMode('work');
    setPomodoroTime(25 * 60);
  };

  const handleAddAlarm = () => {
    if (alarmTime) {
      const newAlarm = {
        id: Math.random().toString(36).substring(7),
        time: alarmTime,
        label: alarmLabel || 'Alarm',
        enabled: true,
      };
      setAlarms([...alarms, newAlarm]);
      setAlarmTime('');
      setAlarmLabel('');
      toast({
        title: "Alarm Added",
        description: `Alarm set for ${alarmTime}`,
      });
    }
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(alarms.filter((alarm) => alarm.id !== id));
  };

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map((alarm) =>
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    ));
  };

  const timezones = [
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Chicago', label: 'Chicago (CST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'Mumbai (IST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZDT)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="h-8 w-8" />
          Clocks & Timers
        </h1>
        <p className="text-muted-foreground mt-2">
          World clocks, timers, stopwatch, and productivity tools
        </p>
      </div>

      <Tabs defaultValue="world-clock" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="world-clock">
            <Globe className="h-4 w-4 mr-2" />
            World Clock
          </TabsTrigger>
          <TabsTrigger value="stopwatch">
            <Timer className="h-4 w-4 mr-2" />
            Stopwatch
          </TabsTrigger>
          <TabsTrigger value="timer">
            <Hourglass className="h-4 w-4 mr-2" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          <TabsTrigger value="alarm">
            <AlarmClock className="h-4 w-4 mr-2" />
            Alarm
          </TabsTrigger>
        </TabsList>

        {/* World Clock */}
        <TabsContent value="world-clock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>World Clock</CardTitle>
              <CardDescription>
                View current time across different timezones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedTimezones.map((tz) => {
                  const tzInfo = timezones.find((t) => t.value === tz);
                  return (
                    <Card key={tz} className="border-2">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <p className="text-sm font-medium">{tzInfo?.label}</p>
                          <p className="text-3xl font-bold tabular-nums">
                            {getTimeInTimezone(tz)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getDateInTimezone(tz)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="pt-4 border-t">
                <Label htmlFor="add-timezone">Add Timezone</Label>
                <div className="flex gap-2 mt-2">
                  <Select
                    onValueChange={(value) => {
                      if (!selectedTimezones.includes(value)) {
                        setSelectedTimezones([...selectedTimezones, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones
                        .filter((tz) => !selectedTimezones.includes(tz.value))
                        .map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stopwatch */}
        <TabsContent value="stopwatch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stopwatch</CardTitle>
              <CardDescription>
                Precise time measurement with lap tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold tabular-nums">
                  {formatTime(stopwatchTime)}
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button
                    size="lg"
                    onClick={handleStopwatchToggle}
                    variant={stopwatchRunning ? "destructive" : "default"}
                  >
                    {stopwatchRunning ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleLap}
                    disabled={!stopwatchRunning}
                  >
                    Lap
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleStopwatchReset}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {laps.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Laps</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {laps.map((lap, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Lap {laps.length - index}
                        </span>
                        <span className="font-mono">{formatTime(lap)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timer */}
        <TabsContent value="timer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Countdown Timer</CardTitle>
              <CardDescription>
                Set a countdown timer for any duration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {timerTime === 0 && !timerRunning ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timer-minutes">Minutes</Label>
                      <Input
                        id="timer-minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timer-seconds">Seconds</Label>
                      <Input
                        id="timer-seconds"
                        type="number"
                        min="0"
                        max="59"
                        value={timerSeconds}
                        onChange={(e) => setTimerSeconds(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTimerMinutes('5');
                        setTimerSeconds('0');
                      }}
                    >
                      5 min
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTimerMinutes('10');
                        setTimerSeconds('0');
                      }}
                    >
                      10 min
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTimerMinutes('15');
                        setTimerSeconds('0');
                      }}
                    >
                      15 min
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTimerMinutes('30');
                        setTimerSeconds('0');
                      }}
                    >
                      30 min
                    </Button>
                  </div>

                  <Button onClick={handleTimerStart} className="w-full" size="lg">
                    Start Timer
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold tabular-nums">
                    {formatTimerTime(timerTime)}
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${((timerInitial - timerTime) / timerInitial) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      size="lg"
                      onClick={handleTimerToggle}
                      variant={timerRunning ? "destructive" : "default"}
                    >
                      {timerRunning ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleTimerReset}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pomodoro */}
        <TabsContent value="pomodoro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pomodoro Timer</CardTitle>
              <CardDescription>
                Boost productivity with the Pomodoro Technique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      pomodoroMode === 'work' ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  />
                  <span className="font-medium">
                    {pomodoroMode === 'work' ? 'Work Session' : 'Break Time'}
                  </span>
                </div>

                <div className="text-6xl font-bold tabular-nums">
                  {formatTimerTime(pomodoroTime)}
                </div>

                <div className="text-sm text-muted-foreground">
                  Sessions completed: {pomodoroSessions}
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    size="lg"
                    onClick={handlePomodoroToggle}
                    variant={pomodoroRunning ? "destructive" : "default"}
                  >
                    {pomodoroRunning ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handlePomodoroReset}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Work for 25 minutes with full focus</li>
                  <li>Take a 5-minute break</li>
                  <li>Repeat the cycle</li>
                  <li>After 4 sessions, take a longer break</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alarm */}
        <TabsContent value="alarm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alarm Clock</CardTitle>
              <CardDescription>
                Set alarms for important reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="alarm-time">Time</Label>
                  <Input
                    id="alarm-time"
                    type="time"
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alarm-label">Label (Optional)</Label>
                  <Input
                    id="alarm-label"
                    type="text"
                    placeholder="Wake up"
                    value={alarmLabel}
                    onChange={(e) => setAlarmLabel(e.target.value)}
                  />
                </div>

                <Button onClick={handleAddAlarm} className="w-full" disabled={!alarmTime}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alarm
                </Button>
              </div>

              <div className="space-y-2">
                {alarms.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <AlarmClock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No alarms set</p>
                  </div>
                ) : (
                  alarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-2xl font-bold">{alarm.time}</p>
                        <p className="text-sm text-muted-foreground">{alarm.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={alarm.enabled ? "default" : "outline"}
                          onClick={() => toggleAlarm(alarm.id)}
                        >
                          {alarm.enabled ? 'On' : 'Off'}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteAlarm(alarm.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Note: Alarms are demonstration only and won't trigger actual notifications
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
