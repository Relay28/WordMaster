package cit.edu.wrdmstr.service.gameplay;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ProfanityFilterServiceTest {

    private final ProfanityFilterService service = new ProfanityFilterService();

    @Test
    void testNoProfanity() {
        var result = service.filter("Hello class this is a friendly message");
        assertFalse(result.hasProfanity());
        assertEquals("Hello class this is a friendly message", result.getFilteredText());
    }

    @Test
    void testProfanityMasked() {
        var result = service.filter("This is shit and bullshit");
        assertTrue(result.hasProfanity());
        assertEquals("This is **** and ****", result.getFilteredText());
    }

    @Test
    void testLeetAndSpacedVariants() {
        var result = service.filter("You f@ c k !!");
        assertTrue(result.hasProfanity());
        assertTrue(result.getFilteredText().contains("****"));
    }
}
