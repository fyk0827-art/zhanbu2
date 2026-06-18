package com.qacollector.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "world_countries")
public class WorldCountry {

    @Id
    private String code;

    @Column(nullable = false, length = 100)
    private String nameZh;

    @Column(nullable = false, length = 100)
    private String nameEn;

    @OneToMany(mappedBy = "country", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("nameZh ASC")
    private List<WorldProvince> provinces = new ArrayList<>();

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getNameZh() { return nameZh; }
    public void setNameZh(String nameZh) { this.nameZh = nameZh; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public List<WorldProvince> getProvinces() { return provinces; }
    public void setProvinces(List<WorldProvince> provinces) { this.provinces = provinces; }
}
