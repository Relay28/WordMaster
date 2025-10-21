package cit.edu.wrdmstr.service.gameplay;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Simple profanity filter (server-side) to discourage bad language without AI latency.
 * Approach:
 *  - Maintain a curated list of base profane words (mild to strong) – exclude substrings inside innocent words.
 *  - Build regex with word boundaries and common leetspeak substitutions (a -> @, s -> $, i -> 1/!, etc.).
 *  - Replace each detected token with a fixed **** (not length preserving to reduce inference of original word).
 *  - Return whether any profanity was found so scoring penalty can be applied.
 * NOTE: List kept intentionally moderate; can be externalized to config if needed.
 */
@Service
public class ProfanityFilterService {

    /** Base words (lowercase) – keep modest list; can be expanded. */
   private static final List<String> BASE_WORDS = List.of(
    // Common profanity
    "shit","shittt","shitty","fuck","fucks","fucked","fucking","fuk","phuck","fucc","fuxk",
    "bitch","b1tch","biatch","bytch","betch","betchh","bich","beetch","bichh",
    "asshole","assholee","asshat","assh0le","azzhole","azz","arse","ashol","jackass","jackasss",
    "bastard","damn","crap","dick","d1ck","d!ck","d*ck","piss","pisss","pissy","slut","slutty",
    "whore","wh0re","whoreee","hoe","h0e","h03","hoeee","hoezzz","motherfucker","motherfukka",
    "cunt","twat","jerk","skank","dumbass","dumass","dummass","dumas","stupidass","idiot","idi0t","idjit",
    "retard","ret4rd","rehtard","r3tard","retardd","moron","mor0n","cretin","dafuq","tf","ts","stfu","sybau",
     "bitches","ass","shits","fucks","fucksake","fukkin","fuked","fuking","fuker","cunts","pisses","piss","./.",
     "(.)(.)","dicks","dickhead","dickhed","dickheadd","dickheaddd", "mothefucker", "twat",
    // Sexual/explicit
    "pussy","pussyy","cock","cum","suckmydick","suckme","suckmy","suckmyd1ck",
    "blowjob","bj","chupa","kantot","chup@","jakol","burat","bilat","pekpek","pekp3k","pekpekx","pekpek_",
    "iyot","nota","totoy","etits","epep",

    // Drug / insult
    "shabu","syabu","shabo","syabo","crackhead","methhead","tweaker","syet",

    // Filipino profanity
    "putangina","putanginaaa","putang ina","putangina_","tangina","tanginaaa","tang1na",
    "put@ngina","pota","pweta","punyeta","punyeta_","p0nyeta","taena","tae na","tae-na","tae",
    "gago","gag0","gagoo","gago_","gaga","gagah","tanga","tangang","bobo","bubong","bobong",
    "ulol","ul0l","yawa","yawa_","yawaa","hayop","hay0p","unggoy","ungg0y","leche","lecheee","buwisit","buwisit_",
    "pakyu","pakyoo","pakyu_","paky0","pakyu!","pakyu-","pakyu123","inutil","demonyo",

    // TikTok / Gen Z
    "thot","th0t","thott","thott0","thotty","slatt","sheesh","shee$h","simp","simping","simpass",
    "fck","fckn","fckr","fkng","fcked","fckface","fckboy","fuckboy","stfu","stfuu","stfu123",
    "smd","smdh","smdh_","smd_",

    // Clever bypass: dots/spaces/underscores
    "s.h.i.t","s.h.i.t.t.y","f.u.c.k","f.u.c.k.e.d","f.u.c.k.i.n.g",
    "n i g g a","n . i . g . g . a","n-i-g-g-a","n_i_g_g_a","n*i*g*g*a",
    "b i t c h","b-i-t-c-h","b_i_t_c_h","b.i.t.c.h","b!tch","btch",
    "f u c k e r","f u c k 3 r","s_h_i_t","f_u_c_k","a_s_s_h_o_l_e","b.i.t.c.h",

    // Repeated chars
    "shiiiiit","fuuuuuck","biitcchh","a$$hole","a$$","a$$h0le","diiiiick",

    // Combined
    "youfuckingidiot","imsuchafuck","badasshole","hiyaasshole",

    // Phonetic / leetspeak
    "phuk","fawk","fak","f4ck","sh1t","sh!t","shyt","shiet","shiettt","sh1tty","sh1tz",
    "b!tchh","wh0re","whr","w.h.o.r.e","kneagear","kne@gear","kne4gear","kn3ag3ar","kn3ag3r",

    // Emoji sandwich
    "f👎ck","s💩t","n🅰️gga","b👁tch","b💣tch",

    // Non-ASCII homoglyphs
    "ɴɪɢɢᴀ","ɴɪɢɢᴇʀ","nιgga","nіgga","njgga","nıgga",

    // Racial / ethnic slurs
    "nigger","nigga","n1gga","ni99a","niqqa","niga","n!gga","nigg@","nigg4",
    "chink","ch1nk","chingchong","ch!nk","gook","g00k","spic","sp1c","beaner","beener","wetback","w3tback",
    "paki","pak1","p@ki","raghead","camel jockey","cameljockey","kike","kyke","gypsy","gypo","cracker","cracka",
    "redskin","chief","squaw",

    // Filipino slurs
    "negr0","negrito","negra","negro","negr4","itim","moro","muslimin","badjao","baluga","bisakol",

    // LGBTQ+ slurs
    "fag","faggot","f4g","f@g","f*g","fagg0t","faqqot","dyke","d!ke","d1ke","tranny","tr@nny","tr4nny",

    // Other religion/identity
    "kafir","kaf1r","degenerate","degener8","deg3n",

    // Misc insults
    "noob","nub","trash","loser","los3r","l0ser","garbage","garbageman","garb"
);


    /** Precompiled patterns for efficiency. */
    private final List<Pattern> patterns;

    public ProfanityFilterService() {
        this.patterns = buildPatterns();
    }

    private List<Pattern> buildPatterns() {
        List<Pattern> list = new ArrayList<>();
        for (String base : BASE_WORDS) {
            StringBuilder patternBuilder = new StringBuilder();
            // Build per-character flexible groups and allow punctuation/space between them
            if (base.equals("fuck")) {
                // Special handling for very common obfuscations: f @ u c k, f u c k with symbols
                patternBuilder.append("[fph][\\p{Punct}\\s_]*"); // f variants
                patternBuilder.append("[u@v]{1}[\\p{Punct}\\s_]*"); // u or @ or v (sometimes used)
                patternBuilder.append("[ckq]{1}[\\p{Punct}\\s_]*"); // c/k variants
                patternBuilder.append("[kq]{1}"); // ending
            } else {
                for (int i = 0; i < base.length(); i++) {
                    patternBuilder.append(mapChar(base.charAt(i)));
                    if (i < base.length() - 1) {
                        patternBuilder.append("[\\p{Punct}\\s_]*");
                    }
                }
            }
            String finalRegex = "(?i)\\b" + patternBuilder + "\\b";
            try {
                list.add(Pattern.compile(finalRegex));
            } catch (Exception e) {
                // Fallback: skip pattern if somehow invalid
            }
        }
        return list;
    }

    private String mapChar(char c) {
        return switch (c) {
            case 'a' -> "[a@4]";
            case 'i' -> "[i1!|]"; // include common substitutions
            case 'e' -> "[e3]";
            case 'o' -> "[o0]";
            case 's' -> "[s$5]";
            case 't' -> "[t7]";
            case 'u' -> "[u@v]";
            default -> "[" + Pattern.quote(String.valueOf(c)) + "]"; // single char class
        };
    }

    public Result filter(String original) {
        if (original == null || original.isBlank()) {
            return new Result(original, false, Collections.emptySet());
        }
        String filtered = original;
        Set<String> detected = new HashSet<>();
        for (Pattern p : patterns) {
            Matcher m = p.matcher(filtered);
            boolean found = false;
            StringBuffer sb = new StringBuffer();
            while (m.find()) {
                found = true;
                detected.add(m.group());
                m.appendReplacement(sb, "****");
            }
            if (found) {
                m.appendTail(sb);
                filtered = sb.toString();
            }
        }
        return new Result(filtered, !detected.isEmpty(), detected);
    }

    public static class Result {
        private final String filteredText;
        private final boolean hasProfanity;
        private final Set<String> matches;

        public Result(String filteredText, boolean hasProfanity, Set<String> matches) {
            this.filteredText = filteredText;
            this.hasProfanity = hasProfanity;
            this.matches = matches;
        }

        public String getFilteredText() { return filteredText; }
        public boolean hasProfanity() { return hasProfanity; }
        public Set<String> getMatches() { return matches; }
    }
}
