package com.qacollector.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "world_provinces")
public class WorldProvince {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nameZh;

    @Column(nullable = false, length = 100)
    private String nameEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_code", nullable = false)
    @JsonIgnore
    private WorldCountry country;

    @OneToMany(mappedBy = "province", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("nameZh ASC")
    private List<WorldCity> cities = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNameZh() { return nameZh; }
    public void setNameZh(String nameZh) { this.nameZh = nameZh; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public WorldCountry getCountry() { return country; }
    public void setCountry(WorldCountry country) { this.country = country; }
    public List<WorldCity> getCities() { return cities; }
    public void setCities(List<WorldCity> cities) { this.cities = cities; }
}
