package cit.edu.wrdmstr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WrdmstrApplication {

	public static void main(String[] args) {
		SpringApplication.run(WrdmstrApplication.class, args);
	}

}
