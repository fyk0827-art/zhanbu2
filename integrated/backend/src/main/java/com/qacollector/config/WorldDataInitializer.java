package com.qacollector.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qacollector.entity.WorldCity;
import com.qacollector.entity.WorldCountry;
import com.qacollector.entity.WorldProvince;
import com.qacollector.repository.WorldCountryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WorldDataInitializer implements CommandLineRunner {

    private final WorldCountryRepository countryRepo;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (countryRepo.count() > 0) {
            log.info("World data already seeded ({} countries), skipping", countryRepo.count());
            return;
        }

        log.info("Seeding world city data...");
        ClassPathResource resource = new ClassPathResource("world-cities.json");
        List<Map<String, Object>> countries = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<List<Map<String, Object>>>() {}
        );

        for (Map<String, Object> countryData : countries) {
            WorldCountry country = new WorldCountry();
            country.setCode((String) countryData.get("code"));
            country.setNameZh((String) countryData.get("nameZh"));
            country.setNameEn((String) countryData.get("nameEn"));

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> provincesData = (List<Map<String, Object>>) countryData.get("provinces");

            if (provincesData != null) {
                for (Map<String, Object> provinceData : provincesData) {
                    WorldProvince province = new WorldProvince();
                    province.setNameZh((String) provinceData.get("nameZh"));
                    province.setNameEn((String) provinceData.get("nameEn"));
                    province.setCountry(country);

                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> citiesData = (List<Map<String, Object>>) provinceData.get("cities");

                    if (citiesData != null) {
                        for (Map<String, Object> cityData : citiesData) {
                            WorldCity city = new WorldCity();
                            city.setNameZh((String) cityData.get("nameZh"));
                            city.setNameEn((String) cityData.get("nameEn"));
                            city.setLatitude(new BigDecimal(cityData.get("lat").toString()));
                            city.setLongitude(new BigDecimal(cityData.get("lng").toString()));
                            city.setTimezone(new BigDecimal(cityData.get("tz").toString()));
                            city.setProvince(province);
                            province.getCities().add(city);
                        }
                    }
                    country.getProvinces().add(province);
                }
            }
            countryRepo.save(country);
        }
        log.info("World data seeded: {} countries", countries.size());
    }
}
