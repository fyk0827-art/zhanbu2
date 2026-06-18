package com.qacollector.service;

import com.qacollector.dto.AgeGroupDTO;
import com.qacollector.entity.AgeGroup;
import com.qacollector.repository.AgeGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgeGroupService {
    private final AgeGroupRepository repository;

    public List<AgeGroupDTO> listAll() {
        List<AgeGroup> groups = repository.findAllByOrderBySortOrderAsc();
        List<AgeGroupDTO> result = new ArrayList<>();
        for (AgeGroup g : groups) {
            AgeGroupDTO dto = new AgeGroupDTO();
            dto.setId(g.getId());
            dto.setName(g.getName());
            dto.setMinAge(g.getMinAge());
            dto.setMaxAge(g.getMaxAge());
            dto.setPrice(g.getPrice());
            dto.setSortOrder(g.getSortOrder());
            result.add(dto);
        }
        return result;
    }

    public void setUnifiedPrice(BigDecimal price) {
        List<AgeGroup> groups = repository.findAll();
        for (AgeGroup g : groups) {
            g.setPrice(price);
        }
        repository.saveAll(groups);
    }
}
