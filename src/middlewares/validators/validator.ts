import { Request, Response, NextFunction } from "express";
import {status_codes} from "../../utils/status_constants.js";

const validateSignUpInputForParent = (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const sanitizedData = {
        first_name: req.body.first_name?.trim() || "",
        last_name: req.body.last_name?.trim() || "",
        email: req.body.email?.trim().toLowerCase() || "",
        photo: req.body.photo?.trim() || "",
        phone_number: req.body.phone_number?.trim() || "",
        country: req.body.country?.trim() || "",
        gender: req.body.gender?.trim() || "",
        password: req.body.password?.trim() || "",
    };

    if (!sanitizedData.first_name) errors.push("Invalid first name");
    if (!sanitizedData.last_name) errors.push("Invalid last name");
    if (!sanitizedData.phone_number) errors.push("Invalid phone number");
    if (!sanitizedData.country) errors.push("Invalid country");
    if (!sanitizedData.gender) errors.push("Invalid gender");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedData.email)) errors.push("Enter a valid email address");

    const passwordErrors = validatePassword(sanitizedData.password);
    errors.push(...passwordErrors);

    if (!errors.length) {
        req.body = sanitizedData;
        return next();
    }
    res.status(status_codes.HTTP_400_BAD_REQUEST).json({ status: 400, errors });
};


const validateSignUpInputForAdmin = (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const sanitizedData = {
        full_name: req.body.full_name?.trim() || "",
        email: req.body.email?.trim().toLowerCase() || "",
        password: req.body.password?.trim() || "",
    };

    if (!sanitizedData.full_name) {
        errors.push("Full name is required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedData.email)) {
        errors.push("Enter a valid email address");
    }

    const passwordErrors = validatePassword(sanitizedData.password);
    errors.push(...passwordErrors);

    if (!errors.length) {
        req.body = sanitizedData;
        next();
    } else {
        res.status(status_codes.HTTP_400_BAD_REQUEST).json({ status: 400, errors });
    }
};

const validateAuthInputForKid = (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const sanitizedData = {
        name: req.body.name?.trim() || "",
        photo: req.body.photo?.trim() || "",
        password: req.body.password?.trim() || "",
    };

    if (!sanitizedData.name) {
        errors.push("Name is required");
    }

    const passwordErrors = validatePassword(sanitizedData.password);
    errors.push(...passwordErrors);

    if (!errors.length) {
        req.body = sanitizedData;
        next();
    } else {
        res.status(status_codes.HTTP_400_BAD_REQUEST).json({ status: 400, errors });
    }
};



const validateSignInInput = (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const sanitizedData = {
        email: req.body.email?.trim().toLowerCase() || "",
        password: req.body.password?.trim() || "",
    };

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedData.email)) {
        errors.push("Enter a valid email address");
    }

    // Password validation
    if (!sanitizedData.password || sanitizedData.password.length < 8) {
        errors.push("Password should be at least 8 characters");
    }

    if (!errors.length) {
        req.body = sanitizedData; // Use sanitized data instead of mutating `req.body`
        next();
    } else {
        res.status(status_codes.HTTP_400_BAD_REQUEST).json({ status: 400, errors });
    }
};


const comparePassword = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.password === req.body.confirm_password) {
        next();
        return
    } else {
        res
            .status(status_codes.HTTP_400_BAD_REQUEST)
            .json({ status: 400, message: "Passwords do not match" });
    }
};



function validatePassword(password: string): string[] {
    const errors: string[] = [];
    if (!password || password.length < 8) {
        errors.push("Password should be at least 8 characters");
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        errors.push("Password should contain at least one special character");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password should contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password should contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Password should contain at least one digit");
    }
    return errors;
}

function validateUserRequestPassword(req: Request, res: Response, next: NextFunction) {
    const errors: string[] = [];
    const sanitizedData = { 
        password: req.body.password?.trim() || "",
    };
    const passwordErrors = validatePassword(sanitizedData.password);
    errors.push(...passwordErrors);
    if (!errors.length) {
        req.body = sanitizedData; // Use sanitized data instead of mutating `req.body`
        next();
    } else {
        res.status(status_codes.HTTP_400_BAD_REQUEST).json({ status: 400, errors });
    }
}



export {validateSignUpInputForParent, validateSignUpInputForAdmin, validateAuthInputForKid, validateSignInInput, validateUserRequestPassword}