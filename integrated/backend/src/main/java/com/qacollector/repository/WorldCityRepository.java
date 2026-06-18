package com.qacollector.repository;

import com.qacollector.entity.WorldCity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorldCityRepository extends JpaRepository<WorldCity, Long> {
    List<WorldCity> findByProvinceIdOrderByNameZhAsc(Long provinceId);
}
