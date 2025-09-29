package cit.edu.wrdmstr.config;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Logs which JDBC URL and username the application ended up using at startup.
 * This helps verify whether the correct (e.g. RDS) database is wired when
 * deploying with different Spring profiles.
 */
@Component
public class DataSourceLogConfig {
    private static final Logger log = LoggerFactory.getLogger(DataSourceLogConfig.class);

    private final DataSource dataSource;

    public DataSourceLogConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logDataSource() {
        try {
            if (dataSource instanceof HikariDataSource hikari) {
                log.info("[DB-INIT] Active JDBC URL: {}", hikari.getJdbcUrl());
                log.info("[DB-INIT] Active DB Username: {}", hikari.getUsername());
                log.info("[DB-INIT] Pool Max Size: {}", hikari.getMaximumPoolSize());
            } else {
                log.info("[DB-INIT] DataSource class: {}", dataSource.getClass().getName());
            }
        } catch (Exception e) {
            log.warn("[DB-INIT] Unable to log datasource details: {}", e.getMessage());
        }
    }
}
