package cit.edu.wrdmstr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MicrosoftAuthRequest {
    private String idToken;
    private String accessToken;
    private String code;
    private String redirectUri;

    public static MicrosoftAuthRequest create(String code, String redirectUri) {
        MicrosoftAuthRequest request = new MicrosoftAuthRequest();
        request.setCode(code);
        request.setRedirectUri(redirectUri);
        return request;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
}
