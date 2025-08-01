package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.service.ExcelExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/export")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ExcelExportController {

    @Autowired
    private ExcelExportService excelExportService;

    @GetMapping("/student-reports/{contentId}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<?> exportStudentReports(
            @PathVariable Long contentId,
            @RequestParam(required = false) String date,
            Authentication authentication) {

        try {
            System.out.println("=== EXPORT REQUEST START ===");
            System.out.println("Content ID: " + contentId);
            System.out.println("Date filter: " + date);
            System.out.println("User: " + authentication.getName());
            System.out.println("Authorities: " + authentication.getAuthorities());

            byte[] excelData = excelExportService.exportStudentReports(contentId, date, authentication);

            if (excelData == null || excelData.length == 0) {
                System.err.println("Generated Excel data is null or empty");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Generated file is empty");
            }

            System.out.println("Excel data generated successfully. Size: " + excelData.length + " bytes");

            // Generate filename
            String dateStr = date != null ? date.replace("-", "") : new SimpleDateFormat("yyyyMMdd").format(new Date());
            String filename = String.format("class_record_content_%d_%s.xlsx", contentId, dateStr);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(excelData.length);
            headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
            headers.add("Pragma", "no-cache");
            headers.add("Expires", "0");

            System.out.println("=== EXPORT REQUEST SUCCESS ===");
            System.out.println("Filename: " + filename);
            System.out.println("Content-Type: " + headers.getContentType());

            return new ResponseEntity<>(excelData, headers, HttpStatus.OK);

        } catch (IOException e) {
            System.err.println("IOException in export: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Excel generation failed: " + e.getMessage()).getBytes());
        } catch (RuntimeException e) {
            System.err.println("RuntimeException in export: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage().getBytes());
        } catch (Exception e) {
            System.err.println("Unexpected exception in export: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Unexpected error: " + e.getMessage()).getBytes());
        }
    }

    @GetMapping("/available-dates/{contentId}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<List<String>> getAvailableDates(
            @PathVariable Long contentId,
            Authentication authentication) {
        try {
            List<String> availableDates = excelExportService.getAvailableSessionDates(contentId, authentication);
            return ResponseEntity.ok(availableDates);
        } catch (Exception e) {
            System.err.println("Error getting available dates: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
