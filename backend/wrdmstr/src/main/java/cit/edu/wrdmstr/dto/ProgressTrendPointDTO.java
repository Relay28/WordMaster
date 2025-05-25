package cit.edu.wrdmstr.dto;

import java.util.Date;

public class ProgressTrendPointDTO {
    private Date timestamp;
    private double value;

    public ProgressTrendPointDTO(Date timestamp, double value) {
        this.timestamp = timestamp;
        this.value = value;
    }

// Getters and setters

    public Date getTimestamp() {

        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public double getValue() {
        return value;
    }

    public void setValue(double value) {
        this.value = value;
    }
}
