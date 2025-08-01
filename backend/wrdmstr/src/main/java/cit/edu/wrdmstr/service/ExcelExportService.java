package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExcelExportService {

    @Autowired
    private GameSessionEntityRepository gameSessionRepository;
    
    @Autowired
    private TeacherFeedbackRepository feedbackRepository;
    
    @Autowired
    private PlayerSessionEntityRepository playerSessionRepository;
    
    @Autowired
    private ChatMessageEntityRepository chatMessageRepository;
    
    @Autowired
    private ScoreRecordEntityRepository scoreRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ContentRepository contentRepository;

    private UserEntity getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public byte[] exportStudentReports(Long contentId, String dateFilter, Authentication authentication) throws IOException {
        System.out.println("ExcelExportService - Starting export for contentId: " + contentId);
        System.out.println("Authentication: " + authentication.getName());
        System.out.println("Date filter: " + dateFilter);
        
        try {
            // Verify authentication and authorization
            UserEntity authenticatedUser = getAuthenticatedUser(authentication);
            System.out.println("Authenticated user: " + authenticatedUser.getEmail() + ", Role: " + authenticatedUser.getRole());
            
            // Verify the content exists and belongs to the authenticated teacher
            ContentEntity content = contentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Content not found"));
            
            System.out.println("Content found: " + content.getTitle());
            System.out.println("Content classroom teacher: " + content.getClassroom().getTeacher().getEmail());
            
            // Check if the authenticated user is the owner of the content's classroom
            if (!(content.getClassroom().getTeacher().getId() ==(authenticatedUser.getId()))) {
                System.err.println("Access denied: User " + authenticatedUser.getEmail() + 
                    " is not the teacher of classroom " + content.getClassroom().getName());
                throw new RuntimeException("Access denied: You can only export reports for your own content");
            }
            
            // Get all game sessions for the content
            List<GameSessionEntity> sessions = gameSessionRepository.findByContentId(contentId);
            System.out.println("Found " + sessions.size() + " sessions for content");
            
            // Additional security check: ensure all sessions belong to the authenticated teacher
            sessions = sessions.stream()
                .filter(session -> {
                    boolean isTeacher = session.getTeacher().getId()==authenticatedUser.getId();
                    if (!isTeacher) {
                        System.out.println("Filtering out session " + session.getId() + 
                            " - teacher mismatch: " + session.getTeacher().getEmail());
                    }
                    return isTeacher;
                })
                .collect(Collectors.toList());
            
            System.out.println("After teacher filtering: " + sessions.size() + " sessions");
            
            // Filter by date if provided
            if (dateFilter != null && !dateFilter.isEmpty()) {
                Date filterDate = parseDate(dateFilter);
                sessions = sessions.stream()
                    .filter(session -> isSameDate(session.getStartedAt(), filterDate))
                    .collect(Collectors.toList());
                System.out.println("After date filtering: " + sessions.size() + " sessions");
            }
            
            if (sessions.isEmpty()) {
                throw new RuntimeException("No game sessions found for the specified criteria");
            }

            Workbook workbook = new XSSFWorkbook();
            
            try {
                // Create class record sheet
                createClassRecordSheet(workbook, sessions, content);
                
                // Create detailed session sheets
                for (GameSessionEntity session : sessions) {
                    createDetailedSessionSheet(workbook, session);
                }
                
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                workbook.write(outputStream);
                
                byte[] result = outputStream.toByteArray();
                System.out.println("Excel file generated successfully, size: " + result.length + " bytes");
                
                return result;
            } finally {
                workbook.close();
            }
        } catch (Exception e) {
            System.err.println("Error in exportStudentReports: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Failed to generate Excel report", e);
        }
    }
    
    private void createClassRecordSheet(Workbook workbook, List<GameSessionEntity> sessions, ContentEntity content) {
        Sheet sheet = workbook.createSheet("Class Record");
        
        // Create styles
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        CellStyle numberStyle = createNumberStyle(workbook);
        CellStyle gradeStyle = createGradeStyle(workbook);
        CellStyle absentStyle = createAbsentStyle(workbook);
        
        int currentRow = 0;
        
        // Title section
        Row titleRow = sheet.createRow(currentRow++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("CLASS RECORD - " + content.getTitle().toUpperCase());
        titleCell.setCellStyle(titleStyle);
        
        // Class info
        Row classRow = sheet.createRow(currentRow++);
        classRow.createCell(0).setCellValue("Classroom: " + content.getClassroom().getName());
        classRow.getCell(0).setCellStyle(dataStyle);
        
        Row teacherRow = sheet.createRow(currentRow++);
        teacherRow.createCell(0).setCellValue("Teacher: " + content.getClassroom().getTeacher().getFname() + 
            " " + content.getClassroom().getTeacher().getLname());
        teacherRow.getCell(0).setCellStyle(dataStyle);
        
        Row dateRow = sheet.createRow(currentRow++);
        dateRow.createCell(0).setCellValue("Generated: " + new SimpleDateFormat("MMMM dd, yyyy 'at' HH:mm").format(new Date()));
        dateRow.getCell(0).setCellStyle(dataStyle);
        
        Row totalSessionsRow = sheet.createRow(currentRow++);
        totalSessionsRow.createCell(0).setCellValue("Total Sessions: " + sessions.size());
        totalSessionsRow.getCell(0).setCellStyle(dataStyle);
        
        currentRow++; // Empty row
        
        // Get all unique students across all sessions
        Set<UserEntity> allStudents = new HashSet<>();
        Map<Long, List<PlayerSessionEntity>> studentSessions = new HashMap<>();
        Map<String, GameSessionEntity> sessionsByDate = new HashMap<>();
        
        for (GameSessionEntity session : sessions) {
            List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(session.getId());
            String dateKey = new SimpleDateFormat("yyyy-MM-dd").format(session.getStartedAt());
            sessionsByDate.put(dateKey, session);
            
            for (PlayerSessionEntity player : players) {
                allStudents.add(player.getUser());
                studentSessions.computeIfAbsent(player.getUser().getId(), k -> new ArrayList<>()).add(player);
            }
        }
        
        List<UserEntity> sortedStudents = allStudents.stream()
            .sorted((a, b) -> (a.getLname() + ", " + a.getFname()).compareTo(b.getLname() + ", " + b.getFname()))
            .collect(Collectors.toList());
        
        // Get unique session dates sorted
        List<String> sessionDates = sessions.stream()
            .map(s -> new SimpleDateFormat("yyyy-MM-dd").format(s.getStartedAt()))
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        
        // Headers
        Row headerRow = sheet.createRow(currentRow++);
        int colIndex = 0;
        
        // Student info headers
        headerRow.createCell(colIndex++).setCellValue("No.");
        headerRow.createCell(colIndex++).setCellValue("Student Name");
        headerRow.createCell(colIndex++).setCellValue("Student ID");
        headerRow.createCell(colIndex++).setCellValue("Email");
        
        // Session date headers (with formatted dates)
        for (String date : sessionDates) {
            String formattedDate = new SimpleDateFormat("MMM dd").format(parseDate(date));
            headerRow.createCell(colIndex++).setCellValue(formattedDate);
        }
        
        // Summary headers
        headerRow.createCell(colIndex++).setCellValue("Sessions Attended");
        headerRow.createCell(colIndex++).setCellValue("Total Score");
        headerRow.createCell(colIndex++).setCellValue("Average Score");
        headerRow.createCell(colIndex++).setCellValue("Highest Score");
        headerRow.createCell(colIndex++).setCellValue("Grammar Accuracy %");
        headerRow.createCell(colIndex++).setCellValue("Word Bank Usage");
        headerRow.createCell(colIndex++).setCellValue("Overall Grade");
        headerRow.createCell(colIndex++).setCellValue("Remarks");
        
        // Apply header style
        for (int i = 0; i < colIndex; i++) {
            Cell cell = headerRow.getCell(i);
            if (cell != null) {
                cell.setCellStyle(headerStyle);
            }
        }
        
        // Student data rows
        int studentNo = 1;
        for (UserEntity student : sortedStudents) {
            Row dataRow = sheet.createRow(currentRow++);
            colIndex = 0;
            
            // Student info
            dataRow.createCell(colIndex++).setCellValue(studentNo++);
            dataRow.createCell(colIndex++).setCellValue(student.getLname() + ", " + student.getFname());
            dataRow.createCell(colIndex++).setCellValue(String.valueOf(student.getId()));
            dataRow.createCell(colIndex++).setCellValue(student.getEmail());
            
            List<PlayerSessionEntity> playerSessions = studentSessions.get(student.getId());
            Map<String, PlayerSessionEntity> sessionScoreMap = new HashMap<>();
            
            // Create map of date to player session for easy lookup
            if (playerSessions != null) {
                for (PlayerSessionEntity playerSession : playerSessions) {
                    String sessionDate = new SimpleDateFormat("yyyy-MM-dd").format(
                        playerSession.getSession().getStartedAt());
                    sessionScoreMap.put(sessionDate, playerSession);
                }
            }
            
            // Session scores for each date
            for (String date : sessionDates) {
                Cell scoreCell = dataRow.createCell(colIndex++);
                PlayerSessionEntity playerSession = sessionScoreMap.get(date);
                if (playerSession != null) {
                    scoreCell.setCellValue(playerSession.getTotalScore());
                    scoreCell.setCellStyle(numberStyle);
                } else {
                    scoreCell.setCellValue("ABS");
                    scoreCell.setCellStyle(absentStyle);
                }
            }
            
            // Calculate summary statistics
            if (playerSessions != null && !playerSessions.isEmpty()) {
                // Sessions attended
                dataRow.createCell(colIndex++).setCellValue(playerSessions.size());
                
                // Total score
                int totalScore = playerSessions.stream()
                    .mapToInt(PlayerSessionEntity::getTotalScore)
                    .sum();
                Cell totalScoreCell = dataRow.createCell(colIndex++);
                totalScoreCell.setCellValue(totalScore);
                totalScoreCell.setCellStyle(numberStyle);
                
                // Average score
                double avgScore = playerSessions.stream()
                    .mapToInt(PlayerSessionEntity::getTotalScore)
                    .average().orElse(0.0);
                Cell avgScoreCell = dataRow.createCell(colIndex++);
                avgScoreCell.setCellValue(Math.round(avgScore * 100.0) / 100.0);
                avgScoreCell.setCellStyle(numberStyle);
                
                // Highest score
                int highestScore = playerSessions.stream()
                    .mapToInt(PlayerSessionEntity::getTotalScore)
                    .max().orElse(0);
                Cell highestScoreCell = dataRow.createCell(colIndex++);
                highestScoreCell.setCellValue(highestScore);
                highestScoreCell.setCellStyle(numberStyle);
                
                // Grammar accuracy
                double grammarAccuracy = calculateGrammarAccuracy(student.getId(), playerSessions);
                Cell grammarCell = dataRow.createCell(colIndex++);
                grammarCell.setCellValue(Math.round(grammarAccuracy * 100.0) / 100.0);
                grammarCell.setCellStyle(numberStyle);
                
                // Word bank usage count
                int wordBankUsage = calculateWordBankUsage(student.getId(), playerSessions);
                Cell wordBankCell = dataRow.createCell(colIndex++);
                wordBankCell.setCellValue(wordBankUsage);
                wordBankCell.setCellStyle(numberStyle);
                
                // Overall grade
                Cell gradeCell = dataRow.createCell(colIndex++);
                String grade = calculateOverallGrade(avgScore);
                gradeCell.setCellValue(grade);
                gradeCell.setCellStyle(gradeStyle);
                
                // Remarks (blank for teacher input)
                Cell remarksCell = dataRow.createCell(colIndex++);
                remarksCell.setCellValue("");
                remarksCell.setCellStyle(dataStyle);
            } else {
                // Fill empty cells for students with no sessions
                for (int i = 0; i < 8; i++) {
                    Cell emptyCell = dataRow.createCell(colIndex++);
                    emptyCell.setCellValue("");
                    emptyCell.setCellStyle(dataStyle);
                }
            }
            
            // Apply data style to first 4 columns (student info)
            for (int i = 0; i < 4; i++) {
                if (dataRow.getCell(i) != null) {
                    dataRow.getCell(i).setCellStyle(dataStyle);
                }
            }
        }
        
        // Merge title across all columns
        if (colIndex > 1) {
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, colIndex - 1));
        }
        
        // Auto-size columns
        for (int i = 0; i < colIndex; i++) {
            sheet.autoSizeColumn(i);
            // Set minimum width for better readability
            if (sheet.getColumnWidth(i) < 2500) {
                sheet.setColumnWidth(i, 2500);
            }
        }
        
        // Freeze panes (freeze first 4 columns and header row)
        sheet.createFreezePane(4, currentRow - sortedStudents.size());
    }
    
    private double calculateGrammarAccuracy(Long studentId, List<PlayerSessionEntity> playerSessions) {
        int totalMessages = 0;
        int perfectMessages = 0;
        
        for (PlayerSessionEntity session : playerSessions) {
            List<ChatMessageEntity> messages = chatMessageRepository
                .findBySessionIdAndSenderId(session.getSession().getId(), studentId);
            
            totalMessages += messages.size();
            perfectMessages += (int) messages.stream()
                .filter(m -> m.getGrammarStatus() == ChatMessageEntity.MessageStatus.PERFECT)
                .count();
        }
        
        return totalMessages > 0 ? (perfectMessages * 100.0) / totalMessages : 0.0;
    }
    
    private int calculateWordBankUsage(Long studentId, List<PlayerSessionEntity> playerSessions) {
        int totalUsage = 0;
        
        for (PlayerSessionEntity session : playerSessions) {
            totalUsage += (int) scoreRepository.findBySessionIdAndUserId(
                session.getSession().getId(), studentId).stream()
                .filter(s -> s.getReason() != null && s.getReason().contains("word bank"))
                .count();
        }
        
        return totalUsage;
    }
    
    private CellStyle createAbsentStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        Font font = workbook.createFont();
        font.setColor(IndexedColors.RED.getIndex());
        font.setBold(true);
        style.setFont(font);
        
        return style;
    }
    
    private void createDetailedSessionSheet(Workbook workbook, GameSessionEntity session) {
        String sheetName = "Session_" + new SimpleDateFormat("MMdd").format(session.getStartedAt());
        
        // Ensure unique sheet name
        int counter = 1;
        String originalName = sheetName;
        while (workbook.getSheet(sheetName) != null) {
            sheetName = originalName + "_" + counter++;
        }
        
        Sheet sheet = workbook.createSheet(sheetName);
        
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        CellStyle titleStyle = createTitleStyle(workbook);
        
        int currentRow = 0;
        
        // Session header info
        Row titleRow = sheet.createRow(currentRow++);
        titleRow.createCell(0).setCellValue("SESSION DETAILS - " + new SimpleDateFormat("MMMM dd, yyyy").format(session.getStartedAt()));
        titleRow.getCell(0).setCellStyle(titleStyle);
        
        Row sessionIdRow = sheet.createRow(currentRow++);
        sessionIdRow.createCell(0).setCellValue("Session ID: " + session.getId());
        sessionIdRow.getCell(0).setCellStyle(dataStyle);
        
        Row contentRow = sheet.createRow(currentRow++);
        contentRow.createCell(0).setCellValue("Content: " + session.getContent().getTitle());
        contentRow.getCell(0).setCellStyle(dataStyle);
        
        Row timeRow = sheet.createRow(currentRow++);
        timeRow.createCell(0).setCellValue("Time: " + new SimpleDateFormat("HH:mm").format(session.getStartedAt()));
        timeRow.getCell(0).setCellStyle(dataStyle);
        
        currentRow++; // Empty row
        
        // Student performance table
        Row headerRow = sheet.createRow(currentRow++);
        String[] headers = {
            "Student Name", "Email", "Role", "Total Score", "Messages Sent", 
            "Perfect Grammar", "Minor Errors", "Major Errors", "Grammar Accuracy %",
            "Word Bank Usage", "Grammar Streak", "Teacher Feedback", "Overall Grade"
        };
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(session.getId());
        
        for (PlayerSessionEntity player : players) {
            Row row = sheet.createRow(currentRow++);
            int colIdx = 0;
            
            // Get statistics
            List<ChatMessageEntity> messages = chatMessageRepository
                .findBySessionIdAndSenderId(session.getId(), player.getUser().getId());
            
            Map<String, Long> grammarStats = messages.stream()
                .collect(Collectors.groupingBy(
                    msg -> msg.getGrammarStatus().toString(),
                    Collectors.counting()
                ));
            
            long wordBankUsage = scoreRepository.findBySessionIdAndUserId(
                session.getId(), player.getUser().getId()).stream()
                .filter(s -> s.getReason() != null && s.getReason().contains("word bank"))
                .count();
            
            Optional<TeacherFeedbackEntity> feedback = feedbackRepository
                .findByGameSessionIdAndStudentId(session.getId(), player.getUser().getId());
            
            // Fill data
            row.createCell(colIdx++).setCellValue(player.getUser().getFname() + " " + player.getUser().getLname());
            row.createCell(colIdx++).setCellValue(player.getUser().getEmail());
            row.createCell(colIdx++).setCellValue(player.getRole() != null ? player.getRole().getName() : "N/A");
            row.createCell(colIdx++).setCellValue(player.getTotalScore());
            row.createCell(colIdx++).setCellValue(messages.size());
            row.createCell(colIdx++).setCellValue(grammarStats.getOrDefault("PERFECT", 0L));
            row.createCell(colIdx++).setCellValue(grammarStats.getOrDefault("MINOR_ERRORS", 0L));
            row.createCell(colIdx++).setCellValue(grammarStats.getOrDefault("MAJOR_ERRORS", 0L));
            
            // Grammar accuracy
            double accuracy = messages.isEmpty() ? 0 : 
                (grammarStats.getOrDefault("PERFECT", 0L) * 100.0) / messages.size();
            row.createCell(colIdx++).setCellValue(Math.round(accuracy * 100.0) / 100.0);
            
            row.createCell(colIdx++).setCellValue(wordBankUsage);
            row.createCell(colIdx++).setCellValue(player.getGrammarStreak());
            
            if (feedback.isPresent()) {
                TeacherFeedbackEntity fb = feedback.get();
                row.createCell(colIdx++).setCellValue(fb.getFeedback() != null ? fb.getFeedback() : "");
                row.createCell(colIdx++).setCellValue(fb.getOverallGrade() != null ? fb.getOverallGrade() : "");
            } else {
                row.createCell(colIdx++).setCellValue("No feedback provided");
                row.createCell(colIdx++).setCellValue("");
            }
            
            // Apply styles
            for (int i = 0; i < headers.length; i++) {
                if (row.getCell(i) != null) {
                    row.getCell(i).setCellStyle(dataStyle);
                }
            }
        }
        
        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private String calculateOverallGrade(double avgScore) {
        if (avgScore >= 95) return "A+";
        if (avgScore >= 90) return "A";
        if (avgScore >= 85) return "A-";
        if (avgScore >= 80) return "B+";
        if (avgScore >= 75) return "B";
        if (avgScore >= 70) return "B-";
        if (avgScore >= 65) return "C+";
        if (avgScore >= 60) return "C";
        if (avgScore >= 55) return "C-";
        if (avgScore >= 50) return "D";
        return "F";
    }
    
    private CellStyle createNumberStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("0.00"));
        return style;
    }
    
    private CellStyle createGradeStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }
    
    private void createSessionSheet(Workbook workbook, GameSessionEntity session) {
        String sheetName = "Session_" + session.getId();
        Sheet sheet = workbook.createSheet(sheetName);
        
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        
        // Session info
        Row infoRow1 = sheet.createRow(0);
        infoRow1.createCell(0).setCellValue("Session ID:");
        infoRow1.createCell(1).setCellValue(session.getId());
        
        Row infoRow2 = sheet.createRow(1);
        infoRow2.createCell(0).setCellValue("Content:");
        infoRow2.createCell(1).setCellValue(session.getContent().getTitle());
        
        Row infoRow3 = sheet.createRow(2);
        infoRow3.createCell(0).setCellValue("Date:");
        infoRow3.createCell(1).setCellValue(new SimpleDateFormat("yyyy-MM-dd HH:mm").format(session.getStartedAt()));
        
        // Empty row
        sheet.createRow(3);
        
        // Player data header
        Row headerRow = sheet.createRow(4);
        String[] headers = {
            "Student Name", "Email", "Role", "Total Score", "Messages", 
            "Word Bank Usage", "Grammar Streak", "Perfect Grammar", "Minor Errors", "Major Errors",
            "Comprehension", "Participation", "Language Use", "Role Adherence", "Vocabulary", "Overall Grade"
        };
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(session.getId());
        int rowNum = 5;
        
        for (PlayerSessionEntity player : players) {
            Row row = sheet.createRow(rowNum++);
            
            // Get statistics
            List<ChatMessageEntity> messages = chatMessageRepository
                .findBySessionIdAndSenderId(session.getId(), player.getUser().getId());
            
            Map<String, Long> grammarStats = messages.stream()
                .collect(Collectors.groupingBy(
                    msg -> msg.getGrammarStatus().toString(),
                    Collectors.counting()
                ));
            
            long wordBankUsage = scoreRepository.findBySessionIdAndUserId(
                session.getId(), player.getUser().getId()).stream()
                .filter(s -> s.getReason() != null && s.getReason().contains("word bank"))
                .count();
            
            Optional<TeacherFeedbackEntity> feedback = feedbackRepository
                .findByGameSessionIdAndStudentId(session.getId(), player.getUser().getId());
            
            // Fill data
            row.createCell(0).setCellValue(player.getUser().getFname() + " " + player.getUser().getLname());
            row.createCell(1).setCellValue(player.getUser().getEmail());
            row.createCell(2).setCellValue(player.getRole() != null ? player.getRole().getName() : "N/A");
            row.createCell(3).setCellValue(player.getTotalScore());
            row.createCell(4).setCellValue(messages.size());
            row.createCell(5).setCellValue(wordBankUsage);
            row.createCell(6).setCellValue(player.getGrammarStreak());
            row.createCell(7).setCellValue(grammarStats.getOrDefault("PERFECT", 0L));
            row.createCell(8).setCellValue(grammarStats.getOrDefault("MINOR_ERRORS", 0L));
            row.createCell(9).setCellValue(grammarStats.getOrDefault("MAJOR_ERRORS", 0L));
            
            if (feedback.isPresent()) {
                TeacherFeedbackEntity fb = feedback.get();
                row.createCell(10).setCellValue(fb.getComprehensionScore() != null ? fb.getComprehensionScore() : 0);
                row.createCell(11).setCellValue(fb.getParticipationScore() != null ? fb.getParticipationScore() : 0);
                row.createCell(12).setCellValue(fb.getLanguageUseScore() != null ? fb.getLanguageUseScore() : 0);
                row.createCell(13).setCellValue(fb.getRoleAdherenceScore() != null ? fb.getRoleAdherenceScore() : 0);
                row.createCell(14).setCellValue(fb.getVocabularyScore() != null ? fb.getVocabularyScore() : 0);
                row.createCell(15).setCellValue(fb.getOverallGrade() != null ? fb.getOverallGrade() : "");
            } else {
                for (int i = 10; i <= 15; i++) {
                    row.createCell(i).setCellValue("");
                }
            }
            
            // Apply styles
            for (int i = 0; i < headers.length; i++) {
                row.getCell(i).setCellStyle(dataStyle);
            }
        }
        
        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }
    
    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        return style;
    }
    
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        
        return style;
    }
    
    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        return style;
    }
    
    private Date parseDate(String dateString) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            return sdf.parse(dateString);
        } catch (Exception e) {
            throw new RuntimeException("Invalid date format. Use yyyy-MM-dd");
        }
    }
    
    private boolean isSameDate(Date date1, Date date2) {
        if (date1 == null || date2 == null) return false;
        
        Calendar cal1 = Calendar.getInstance();
        Calendar cal2 = Calendar.getInstance();
        cal1.setTime(date1);
        cal2.setTime(date2);
        
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
               cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
    }

    public List<String> getAvailableSessionDates(Long contentId, Authentication authentication) {
        try {
            UserEntity authenticatedUser = getAuthenticatedUser(authentication);
            
            // Verify the content exists and belongs to the authenticated teacher
            ContentEntity content = contentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Content not found"));
            
            if (!(content.getClassroom().getTeacher().getId() ==(authenticatedUser.getId()))) {
                throw new RuntimeException("Access denied: You can only view dates for your own content");
            }
            
            // Get all game sessions for the content
            List<GameSessionEntity> sessions = gameSessionRepository.findByContentId(contentId);
            
            // Filter sessions by teacher and extract unique dates
            return sessions.stream()
                .filter(session -> session.getTeacher().getId()==(authenticatedUser.getId()))
                .map(session -> new SimpleDateFormat("yyyy-MM-dd").format(session.getStartedAt()))
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error getting available dates: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }
}
