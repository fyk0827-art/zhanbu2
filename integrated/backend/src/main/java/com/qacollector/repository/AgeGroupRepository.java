package com.qacollector.repository;

import com.qacollector.entity.AgeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgeGroupRepository extends JpaRepository<AgeGroup, Long> {
    List<AgeGroup> findAllByOrderBySortOrderAsc();
}
