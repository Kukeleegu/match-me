package com.example.match_me.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import com.example.match_me.service.UserService;
import com.example.match_me.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final UserService userService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public FileController(UserService userService) {
        this.userService = userService;
    }

    private static final String[] ALLOWED_IMAGE_TYPES = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    };

    @GetMapping("/profile-picture")
    public ResponseEntity<Resource> getProfilePicture() throws IOException {
        // Get the current user
        User user = userService.getCurrentUser();
        
        // Ensure the upload directory exists and get absolute path
        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.isAbsolute()) {
            uploadDirFile = uploadDirFile.getAbsoluteFile();
        }
        
        if (!uploadDirFile.exists()) {
            return ResponseEntity.notFound().build();
        }
        
        // Find the avatar file for this user
        File[] avatarFiles = uploadDirFile.listFiles((dir, name) -> 
            name.startsWith("user_" + user.getId() + "_avatar"));
        
        if (avatarFiles == null || avatarFiles.length == 0) {
            return ResponseEntity.notFound().build();
        }
        
        // Get the first matching file (there should only be one)
        File avatarFile = avatarFiles[0];
        Path filePath = Paths.get(avatarFile.getAbsolutePath());
        Resource resource = new UrlResource(filePath.toUri());
        
        if (resource.exists() && resource.isReadable()) {
            // Determine content type based on file extension
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + avatarFile.getName() + "\"")
                .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/profile-picture/{userId}")
    public ResponseEntity<Resource> getProfilePictureByUserId(@PathVariable Long userId) throws IOException {
        // Ensure the upload directory exists and get absolute path
        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.isAbsolute()) {
            uploadDirFile = uploadDirFile.getAbsoluteFile();
        }
        
        if (!uploadDirFile.exists()) {
            return ResponseEntity.notFound().build();
        }
        
        // Find the avatar file for the specified user
        File[] avatarFiles = uploadDirFile.listFiles((dir, name) -> 
            name.startsWith("user_" + userId + "_avatar"));
        
        if (avatarFiles == null || avatarFiles.length == 0) {
            return ResponseEntity.notFound().build();
        }
        
        // Get the first matching file (there should only be one)
        File avatarFile = avatarFiles[0];
        Path filePath = Paths.get(avatarFile.getAbsolutePath());
        Resource resource = new UrlResource(filePath.toUri());
        
        if (resource.exists() && resource.isReadable()) {
            // Determine content type based on file extension
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + avatarFile.getName() + "\"")
                .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {

        // Check if file is empty
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file to upload");
        }

        // Validate file type
        String contentType = file.getContentType();
        boolean isAllowedType = false;
        for (String type : ALLOWED_IMAGE_TYPES) {
            if (type.equals(contentType)) {
                isAllowedType = true;
                break;
            }
        }

        if (!isAllowedType) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body("Only image files (JPEG, PNG, GIF, WEBP) are allowed");
        }

        // 1. Get the current user and their profile
        User user = userService.getCurrentUser();
    
        // 2. Ensure the upload directory exists
        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.isAbsolute()) {
            uploadDirFile = uploadDirFile.getAbsoluteFile();
        }
        if (!uploadDirFile.exists()) {
            uploadDirFile.mkdirs();
        }
    
        // 3. Delete any existing avatar files for this user
        File[] existingFiles = uploadDirFile.listFiles((dir, name) -> name.startsWith("user_" + user.getId() + "_avatar"));
        if (existingFiles != null) {
            for (File existingFile : existingFiles) {
                existingFile.delete();
            }
        }
    
        // 4. Get the extension from the uploaded file
        String extension = "";
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf('.'));
        }
        
        // 5. Create new filename with the original extension
        String fileName = "user_" + user.getId() + "_avatar" + extension;
        String filePath = uploadDirFile + File.separator + fileName;
    
        // 6. Save the new file
        file.transferTo(new File(filePath));
    
        return ResponseEntity.ok("File uploaded successfully");
    }
}