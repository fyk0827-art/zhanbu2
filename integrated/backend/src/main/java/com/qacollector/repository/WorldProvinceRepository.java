package com.qacollector.repository;

import com.qacollector.entity.WorldProvince;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorldProvinceRepository extends JpaRepository<WorldProvince, Long> {
    List<WorldProvince> findByCountryCodeOrderByNameZhAsc(String countryCode);
}
