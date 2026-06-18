package com.qacollector.repository;

import com.qacollector.entity.WorldCountry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorldCountryRepository extends JpaRepository<WorldCountry, String> {
    List<WorldCountry> findAllByOrderByNameZhAsc();
}
