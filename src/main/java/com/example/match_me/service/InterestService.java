package com.example.match_me.service;

import com.example.match_me.entity.Interest;
import com.example.match_me.DTO.InterestDTO;
import com.example.match_me.repository.InterestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InterestService {

    @Autowired
    private InterestRepository interestRepository;

    public List<InterestDTO> getAllInterests() {
        List<Interest> interests = interestRepository.findAll();
        return interests.stream()
                .map(InterestDTO::new)
                .collect(Collectors.toList());
    }

    public List<InterestDTO> getInterestsByType(Interest.InterestType type) {
        List<Interest> interests = interestRepository.findByType(type);
        return interests.stream()
                .map(InterestDTO::new)
                .collect(Collectors.toList());
    }

    public List<InterestDTO> getInterestsByCategory(String category) {
        List<Interest> interests = interestRepository.findByCategory(category);
        return interests.stream()
                .map(InterestDTO::new)
                .collect(Collectors.toList());
    }

    public List<InterestDTO> searchInterestsByName(String query) {
        List<Interest> interests = interestRepository.findByNameContainingIgnoreCase(query);
        return interests.stream()
                .map(InterestDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public InterestDTO createInterest(InterestDTO interestDTO) {
        Interest interest = new Interest();
        interest.setName(interestDTO.getName());
        interest.setType(interestDTO.getType());
        interest.setCategory(interestDTO.getCategory());
        interest.setSocialType(interestDTO.getSocialType());
        interest.setPhysical(interestDTO.getPhysical());
        interest.setMood(interestDTO.getMood());

        Interest savedInterest = interestRepository.save(interest);
        return new InterestDTO(savedInterest);
    }

    @Transactional
    public InterestDTO updateInterest(Long id, InterestDTO interestDTO) {
        Interest interest = interestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interest not found"));

        interest.setName(interestDTO.getName());
        interest.setType(interestDTO.getType());
        interest.setCategory(interestDTO.getCategory());
        interest.setSocialType(interestDTO.getSocialType());
        interest.setPhysical(interestDTO.getPhysical());
        interest.setMood(interestDTO.getMood());

        Interest savedInterest = interestRepository.save(interest);
        return new InterestDTO(savedInterest);
    }

    @Transactional
    public void deleteInterest(Long id) {
        if (!interestRepository.existsById(id)) {
            throw new RuntimeException("Interest not found");
        }
        interestRepository.deleteById(id);
    }
} 