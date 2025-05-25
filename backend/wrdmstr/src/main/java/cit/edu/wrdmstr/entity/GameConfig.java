package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "game_config")
public class GameConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "students_per_group")
    private Integer studentsPerGroup;

    @Column(name = "time_per_turn")
    private Integer timePerTurn; // in seconds

    @Column(name = "turn_cycles")
    private Integer turnCycles;

    @OneToOne
    @JoinColumn(name = "content_id")
    private ContentEntity content;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getStudentsPerGroup() {
        return studentsPerGroup;
    }

    public void setStudentsPerGroup(Integer studentsPerGroup) {
        this.studentsPerGroup = studentsPerGroup;
    }

    public Integer getTimePerTurn() {
        return timePerTurn;
    }

    public void setTimePerTurn(Integer timePerTurn) {
        this.timePerTurn = timePerTurn;
    }

    public Integer getTurnCycles() {
        return turnCycles;
    }

    public void setTurnCycles(Integer turnCycles) {
        this.turnCycles = turnCycles;
    }

    public ContentEntity getContent() {
        return content;
    }

    public void setContent(ContentEntity content) {
        this.content = content;
    }
}