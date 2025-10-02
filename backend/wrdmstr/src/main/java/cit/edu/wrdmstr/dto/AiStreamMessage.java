package cit.edu.wrdmstr.dto;

public class AiStreamMessage {
    private String type; // partial | final | error
    private String text;

    public AiStreamMessage() {}

    public AiStreamMessage(String type, String text) {
        this.type = type;
        this.text = text;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
