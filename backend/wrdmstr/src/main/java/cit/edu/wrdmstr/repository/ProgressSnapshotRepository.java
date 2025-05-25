package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.ProgressSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgressSnapshotRepository extends JpaRepository<ProgressSnapshot, Long> {
    // Custom query methods can be defined here if needed
    // For example, to find snapshots by student ID or session ID
    List<ProgressSnapshot> findByProgress_Student_Id(Long studentId);
    // ✅ Correct: using nested property traversal
    List<ProgressSnapshot> findByProgress_Session_Id(Long sessionId);


    // This is the method you already had for the more specific query
    List<ProgressSnapshot> findByProgressStudentIdAndProgressSessionIdAndMetricTypeOrderByRecordedAtAsc(
            Long studentId, Long sessionId, String metricType);
}
