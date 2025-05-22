package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "progress_snapshots")
public class ProgressSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "progress_id", nullable = false)
    private StudentProgress progress;

    @Column(name = "metric_type")
    private String metricType; // "GRAMMAR", "VOCABULARY", "COMPREHENSION", etc.

    @Column(name = "metric_value")
    private double metricValue;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "recorded_at", nullable = false)
    private Date recordedAt;

    @PrePersist
    protected void onCreate() {
        recordedAt = new Date();
    }

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public StudentProgress getProgress() {
        return progress;
    }

    public void setProgress(StudentProgress progress) {
        this.progress = progress;
    }

    public String getMetricType() {
        return metricType;
    }

    public void setMetricType(String metricType) {
        this.metricType = metricType;
    }

    public double getMetricValue() {
        return metricValue;
    }

    public void setMetricValue(double metricValue) {
        this.metricValue = metricValue;
    }

    public Date getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(Date recordedAt) {
        this.recordedAt = recordedAt;
    }
}

