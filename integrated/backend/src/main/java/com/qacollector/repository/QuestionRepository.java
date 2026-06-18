package com.qacollector.repository;

import com.qacollector.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    @Query(value = "SELECT * FROM questions WHERE age_group_id = ?1 AND is_active = true ORDER BY RAND() LIMIT ?2", nativeQuery = true)
    List<Question> findRandomByAgeGroupId(Long ageGroupId, int limit);

    List<Question> findByAgeGroupId(Long ageGroupId);
}
