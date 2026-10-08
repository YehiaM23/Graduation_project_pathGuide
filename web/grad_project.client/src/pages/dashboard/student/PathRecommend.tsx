import { useState, useEffect } from 'react';
import { studentApi, recommendApi, dataApi, type CareerRecommendation } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Trophy, Target, Brain, RefreshCw, Check, CheckCircle2 } from 'lucide-react';

interface CareerPathOption {
  careerPathId: number;
  careerPathName: string;
}

export default function PathRecommend() {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [algorithmUsed, setAlgorithmUsed] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // The student's currently declared career path (from their profile), so we can
  // mark it among the recommendations and let them switch to a different one.
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);
  const [savingPathId, setSavingPathId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Full list of career paths for the always-available selector (works even when
  // the recommendation service is unavailable and no recommendation cards show).
  const [careerPaths, setCareerPaths] = useState<CareerPathOption[]>([]);
  const [pickerValue, setPickerValue] = useState('');
  const [savingPicker, setSavingPicker] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get the student profile to obtain studentProfileId and the currently
      // declared career path (so we can highlight it among the recommendations).
      const profileRes = await studentApi.getProfile();
      const studentProfileId = profileRes.data.studentProfileId;
      setSelectedPathId(profileRes.data.careerPathId ?? null);

      const res = await recommendApi.getRecommendations(studentProfileId, 3);
      setRecommendations(res.data.recommendations);
      setAlgorithmUsed(res.data.algorithm_used);
    } catch (err: unknown) {
      console.error('Error fetching recommendations:', err);
      let message = 'An unknown error occurred';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: unknown; status?: number }; message?: string };
        const data = axiosErr.response?.data;
        if (typeof data === 'string') {
          // Backend proxy returns raw JSON string for Python errors
          try {
            const parsed = JSON.parse(data);
            message = parsed.detail || parsed.error || parsed.message || data;
          } catch {
            message = data;
          }
        } else if (data && typeof data === 'object') {
          const obj = data as Record<string, unknown>;
          message = (obj.detail || obj.error || obj.message || JSON.stringify(data)) as string;
        } else {
          message = `Request failed with status ${axiosErr.response?.status}`;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Load every career path once so the selector works regardless of whether
  // recommendations are available.
  useEffect(() => {
    dataApi.getCareerPaths()
      .then((res) => setCareerPaths(res.data))
      .catch((err) => console.error('Failed to load career paths:', err));
  }, []);

  // Keep the dropdown in sync with the student's currently declared path.
  useEffect(() => {
    setPickerValue(selectedPathId != null ? String(selectedPathId) : '');
  }, [selectedPathId]);

  // Save the path chosen in the dropdown to the profile. Only careerPathId is
  // sent; the backend leaves every other profile field untouched.
  const handleSavePicker = async () => {
    const id = pickerValue ? parseInt(pickerValue, 10) : null;
    setSavingPicker(true);
    setActionMessage(null);
    try {
      await studentApi.updateProfile({ careerPathId: id });
      setSelectedPathId(id);
      const name = careerPaths.find((cp) => cp.careerPathId === id)?.careerPathName;
      setActionMessage({
        type: 'success',
        text: id ? `"${name}" is now your career path.` : 'Your career path has been cleared.',
      });
    } catch (err) {
      console.error('Error updating career path:', err);
      setActionMessage({ type: 'error', text: 'Could not update your career path. Please try again.' });
    } finally {
      setSavingPicker(false);
    }
  };

  // Set the chosen recommendation as the student's career path. Only the
  // careerPathId is sent; the backend leaves every other profile field untouched
  // (it partial-updates non-null fields and always assigns CareerPathId).
  const handleSelectPath = async (rec: CareerRecommendation) => {
    setSavingPathId(rec.career_path_id);
    setActionMessage(null);
    try {
      await studentApi.updateProfile({ careerPathId: rec.career_path_id });
      setSelectedPathId(rec.career_path_id);
      setActionMessage({ type: 'success', text: `"${rec.career_path_name}" is now your career path.` });
    } catch (err) {
      console.error('Error selecting career path:', err);
      setActionMessage({ type: 'error', text: 'Could not update your career path. Please try again.' });
    } finally {
      setSavingPathId(null);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-6 w-6 text-gray-400" />;
    return <Trophy className="h-6 w-6 text-amber-700" />;
  };

  const getRankLabel = (index: number) => {
    if (index === 0) return 'Best Fit';
    if (index === 1) return '2nd Best';
    return '3rd Best';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recommended Career Paths</h1>
          <p className="text-muted-foreground mt-2">
            Top 3 career paths tailored to your skills and interests
          </p>
        </div>
        <Button variant="outline" onClick={fetchRecommendations} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Always-available career path selector. Works even when the
          recommendation service is down and no recommendation cards appear. */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Career Path</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Pick your target career path. You can choose one of the recommendations below, or select any path here.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="careerPathPicker">Career path</Label>
              <select
                id="careerPathPicker"
                value={pickerValue}
                onChange={(e) => setPickerValue(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select career path</option>
                {careerPaths.map((cp) => (
                  <option key={cp.careerPathId} value={cp.careerPathId}>
                    {cp.careerPathName}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleSavePicker}
              disabled={
                savingPicker ||
                pickerValue === (selectedPathId != null ? String(selectedPathId) : '')
              }
            >
              {savingPicker ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save career path
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {actionMessage && (
        <Alert variant={actionMessage.type === 'error' ? 'destructive' : 'default'} className="mb-6">
          <AlertDescription>{actionMessage.text}</AlertDescription>
        </Alert>
      )}

      {algorithmUsed && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4" />
          <span>Algorithm: <span className="font-medium">{algorithmUsed}</span></span>
        </div>
      )}

      {recommendations.length === 0 && !error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No recommendations available. Please update your profile with skills and interests first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec, index) => (
            <Card key={rec.career_path_id} className={index === 0 ? 'border-primary border-2' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRankIcon(index)}
                    <div>
                      <CardTitle className="text-xl">{rec.career_path_name}</CardTitle>
                      <Badge variant={index === 0 ? 'default' : 'secondary'} className="mt-1">
                        {getRankLabel(index)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(rec.final_score)}`}>
                      {Math.round(rec.final_score * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Match Score</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className={`text-lg font-semibold ${getScoreColor(rec.interest_score)}`}>
                      {Math.round(rec.interest_score * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Interest Match</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className={`text-lg font-semibold ${getScoreColor(rec.skill_score)}`}>
                      {Math.round(rec.skill_score * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Skill Match</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className={`text-lg font-semibold ${getScoreColor(rec.collaborative_score)}`}>
                      {Math.round(rec.collaborative_score * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Collaborative</div>
                  </div>
                </div>

                {/* Skills Info */}
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <span className="text-muted-foreground">Skills:</span>
                  <span className="font-medium">
                    {rec.skills_matched} / {rec.skills_required} matched
                  </span>
                </div>

                {/* Missing Skills */}
                {rec.missing_skills.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Missing Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.missing_skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Select this path as the student's career path */}
                <div className="mt-4 pt-4 border-t flex items-center justify-end">
                  {selectedPathId === rec.career_path_id ? (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Your current career path
                    </span>
                  ) : (
                    <Button
                      variant={index === 0 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSelectPath(rec)}
                      disabled={savingPathId !== null}
                    >
                      {savingPathId === rec.career_path_id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Set as my career path
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
