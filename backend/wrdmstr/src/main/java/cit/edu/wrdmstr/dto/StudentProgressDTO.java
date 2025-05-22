package cit.edu.wrdmstr.dto;

import java.util.Date;
import java.util.List;
import java.util.Map;


public class StudentProgressDTO {
    private double turnCompletionRate;
    private double avgResponseTime;
    private double grammarAccuracy;
    private double wordBombUsageRate;
    private double comprehensionScore;
    private Map<String, List<ProgressTrendPointDTO>> trends;

    // Getters and setters

    public double getTurnCompletionRate() {
        return turnCompletionRate;
    }

    public void setTurnCompletionRate(double turnCompletionRate) {
        this.turnCompletionRate = turnCompletionRate;
    }

    public double getAvgResponseTime() {
        return avgResponseTime;
    }

    public void setAvgResponseTime(double avgResponseTime) {
        this.avgResponseTime = avgResponseTime;
    }

    public double getGrammarAccuracy() {
        return grammarAccuracy;
    }

    public void setGrammarAccuracy(double grammarAccuracy) {
        this.grammarAccuracy = grammarAccuracy;
    }

    public double getWordBombUsageRate() {
        return wordBombUsageRate;
    }

    public void setWordBombUsageRate(double wordBombUsageRate) {
        this.wordBombUsageRate = wordBombUsageRate;
    }

    public double getComprehensionScore() {
        return comprehensionScore;
    }

    public void setComprehensionScore(double comprehensionScore) {
        this.comprehensionScore = comprehensionScore;
    }

    public Map<String, List<ProgressTrendPointDTO>> getTrends() {
        return trends;
    }

    public void setTrends(Map<String, List<ProgressTrendPointDTO>> trends) {
        this.trends = trends;
    }
}


// For trend data
