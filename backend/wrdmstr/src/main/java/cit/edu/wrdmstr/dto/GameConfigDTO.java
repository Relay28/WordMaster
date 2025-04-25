package cit.edu.wrdmstr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


public class GameConfigDTO {
    private Integer studentsPerGroup;
    private Integer timePerTurn; // in seconds
    private Integer turnCycles;

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
}