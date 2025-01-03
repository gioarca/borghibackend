const Admin = require("../models/admin.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { errorHandler } = require("../utils/error.js");
const { validationResult } = require("express-validator");
const {
  generateRandomPassword,
} = require("../utils/auth/generateRandomPsw.js");
// const Visit = require("../models/visitModel.js");
const User = require("../models/user.model.js");
const {
  sendVisitCancellationEmail,
} = require("../utils/visits/visitCancellationEmail.js");
const { startOfDay, addDays, addHours } = require("date-fns");
const moment = require("moment");
const { sendWelcomeEmail } = require("../utils/doctors/doctorWelcomeEmail.js");
const {
  sendLeaveApprovalEmail,
  sendLeaveDeclinalEmail,
  sendNewLeaveRequestEmailToAdmin,
} = require("../utils/doctors/leaveManagementEmails.js");
const {
  checkDuplicateLeaveRequests,
  validateLeaveRequests,
} = require("../utils/doctors/leaveRequests.js");

//handle errors
// const handleErrors = (err) => {
//   console.log(err.message, err.code);
//   let errors = { email: "", password: "" };

//   //incorrect email
//   if (err.message === "incorrect email") {
//     errors.email = "that email is not registered";
//   }
//   //incorrect password
//   if (err.message === "incorrect password") {
//     errors.password = "that password is incorrect";
//   }

//   // duplicate error code
//   if (err.code === 11000) {
//     errors.email = "that email is already registered";
//     return errors;
//   }

//   //validation errors
//   if (err.message.includes("user validation failed")) {
//     Object.values(err.errors).forEach(({ properties }) => {
//       console.log(properties);
//       errors[properties.path] = properties.message;
//     });
//   }

//   return errors;
// };

// Register a new user, with VAT check for admins
module.exports.signup = async (req, res) => {
  try {
    // const { email, password, role, vatNumber } = req.body; // successivamente
    const { email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await Admin.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // check if the role is valid
    if (!role === "admin") {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Create user with hashed password
    // const user = new Admin({ email, password, role, vatNumber }); // da aggiungere successivamente
    const user = new Admin({ email, password, role });
    // const token = user.generateVerificationToken();

    // user.verificationToken = token;
    await user.save();

    // Send verification email
    // await sendVerificationEmail(user, token);
    res.status(201).json({
      message: "User registered correctly!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await Admin.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!role === "admin") {
      return res.status(400).json({ message: "Invalid role" });
    }
    // // Verify VAT number if the user is an admin
    // if (user.role === "admin" && user.vatNumber !== vatNumber) {
    //   return res.status(401).json({ message: "Invalid VAT number" });
    // }

    // if (!user.isVerified) {
    //   return res.status(403).json({ message: "Email not verified" });
    // }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token });
    console.log("you did it!");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.logout_get = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/signout");
};

const createDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      firstName,
      lastName,
      taxId,
      email,
      specialization,
      city,
      profilePicture,
      about,
      phoneNumber,
      workShifts,
    } = req.body;

    const existingTaxId = await Doctor.findOne({ taxId });
    const existingDoctor = await Doctor.findOne({ email });

    if (existingDoctor || existingTaxId) {
      return res.status(409).json({
        message: "A Doctor with the same TaxId or email already exists",
      });
    }

    let workShiftsGMT = [];
    if (workShifts && workShifts.length > 0) {
      workShiftsGMT = workShifts.map((shift) => ({
        dayOfWeek: shift.dayOfWeek,
        startTime: moment(shift.startTime, "HH:mm").utc().format("HH:mm"),
        endTime: moment(shift.endTime, "HH:mm").utc().format("HH:mm"),
      }));
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = bcryptjs.hashSync(randomPassword, 10);

    const newDoctor = await Doctor.create({
      firstName,
      lastName,
      email,
      taxId,
      password: hashedPassword,
      specialization,
      city,
      profilePicture,
      about,
      phoneNumber,
      workShifts: workShifts === undefined ? workShifts : workShiftsGMT,
    });
    const token = jwt.sign({ userId: newDoctor._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    await sendWelcomeEmail(newDoctor.email, randomPassword, token);

    res.status(201).json({
      message: "Doctor created successfully and email sent",
      doctor: newDoctor,
    });
  } catch (err) {
    console.error(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json(doctors);
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getDoctorProfile = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can see only your account"));
  }

  const userId = req.user.id;

  try {
    const doctor = await Doctor.findById(userId);

    if (!doctor) {
      return res.status(404).json({ message: "doctor not found." });
    }

    const { password, ...rest } = doctor._doc;

    res.status(200).json({ ...rest });
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json(doctor);
  } catch (err) {
    console.log(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getDoctorAvailabilityForSpecificDate = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const visitDate = req.query.visitDate;

    if (!visitDate) {
      return res.status(400).json({ message: "Visit date is required" });
    }

    const currentDate = new Date();

    if (new Date(visitDate) < currentDate) {
      return res
        .status(400)
        .json({ message: "Visit date must be in the future" });
    }

    const minutes = new Date(visitDate).getMinutes();
    if (minutes % 60 !== 0) {
      return res
        .status(400)
        .json({ message: "Visit must be scheduled in one-hour intervals" });
    }

    const isAvailable = await doctor.isAvailable(new Date(visitDate));
    const hasExistingVisits = await doctor.checkExistingVisits(
      new Date(visitDate)
    );

    res.json({ isAvailable, hasExistingVisits });
  } catch (error) {
    console.error("Error getting doctor availability:", error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getDoctorWeeklyAvailability = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const currentDateMoment = moment().utc().startOf("day").add(1, "days");
    const endDateMoment = currentDateMoment.clone().add(6, "days");

    let currentDate = currentDateMoment.toDate();
    const endDate = endDateMoment.toDate();

    const availableSlots = [];

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const workShift = doctor.workShifts.find(
        (shift) => shift.dayOfWeek === dayOfWeek
      );

      if (workShift) {
        let startTime = addHours(
          currentDate,
          parseInt(workShift.startTime.split(":")[0])
        );
        const endTime = addHours(
          currentDate,
          parseInt(workShift.endTime.split(":")[0])
        );
        while (startTime < endTime) {
          const isAvailable = await doctor.isAvailable(startTime);
          const hasExistingVisits = await doctor.checkExistingVisits(startTime);

          if (isAvailable && !hasExistingVisits) {
            availableSlots.push(startTime);
          }

          startTime = addHours(startTime, 1);
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    res.json(availableSlots);
  } catch (error) {
    console.error("Error getting doctor availability:", error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const updateDoctor = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can update only your account"));
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      taxId,
      specialization,
      about,
      city,
      workShifts,
      leaveRequests,
      phoneNumber,
      profilePicture,
    } = req.body;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    const updateFields = {};

    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;

    if (taxId) {
      const existingTaxId = await User.findOne({
        taxId,
        _id: { $ne: req.params.id },
      });
      if (existingTaxId)
        return res.status(409).json({ message: "TaxId already exists" });
      updateFields.taxId = taxId;
    }

    if (email) {
      const existingEmail = await Doctor.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existingEmail)
        return res.status(409).json({ message: "Email already exists" });
      updateFields.email = email;
    }

    if (password) {
      if (password !== confirmPassword) {
        return res
          .status(400)
          .json({ message: "Password and Confirm Password do not match" });
      } else if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must contain at least one lowercase letter, one uppercase letter, and one number",
        });
      } else {
        updateFields.password = bcryptjs.hashSync(password, 10);
      }
    }

    if (specialization) updateFields.specialization = specialization;
    if (about) updateFields.about = about;
    if (city) updateFields.city = city;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (profilePicture) updateFields.profilePicture = profilePicture;
    if (workShifts) updateFields.workShifts = workShifts;
    if (leaveRequests) {
      const existingDoctor = await Doctor.findById(req.params.id);
      const existingLeaveRequests = await Doctor.findById(req.params.id).select(
        "leaveRequests"
      );

      const duplicateError = checkDuplicateLeaveRequests(
        existingLeaveRequests.leaveRequests,
        leaveRequests
      );
      if (duplicateError) {
        return res.status(400).json({ message: duplicateError });
      }

      const validationError = validateLeaveRequests(leaveRequests);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      updateFields.leaveRequests =
        existingDoctor.leaveRequests.concat(leaveRequests);

      for (const request of leaveRequests) {
        request.doctorName = `${existingDoctor.firstName} ${existingDoctor.lastName}`;
        request.doctorEmail = existingDoctor.email;
        await sendNewLeaveRequestEmailToAdmin(request);
      }
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedDoctor) {
      return next(errorHandler(404, "Doctor not found"));
    }

    const { password: userPassword, ...rest } = updatedDoctor._doc;

    res.status(200).json({ user: rest });
  } catch (err) {
    console.log(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const { id: doctorId } = req.params;
    const { id: authUserId, role } = req.user;

    const doctorToDelete = await Doctor.findById(doctorId);

    if (!doctorToDelete) {
      return next(errorHandler(404, "Doctor not found"));
    }

    if (authUserId !== doctorToDelete.id && role !== "admin") {
      return next(
        errorHandler(
          403,
          "Permission denied. You can only delete your own profile or an admin can delete any profile."
        )
      );
    }

    const currentDate = new Date();

    const deletedDoctor = await Doctor.findByIdAndDelete(doctorId);

    if (!deletedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Delete future appointments
    const deletionResult = await Visit.deleteMany({
      doctor: doctorId,
      date: { $gte: currentDate },
    });

    // If any appointments are deleted, send cancellation emails to the affected patients
    if (deletionResult.deletedCount > 0) {
      const futureVisits = await Visit.find({
        doctor: doctorId,
        date: { $gte: currentDate },
      });

      for (const deletedVisit of futureVisits) {
        const patientDetails = await User.findById(deletedVisit.user);
        const userEmail = patientDetails.email;

        // Send visit cancellation email
        await sendVisitCancellationEmail(userEmail, deletedDoctor.email, {
          date: deletedVisit.date,
          doctor: {
            firstName: deletedDoctor.firstName,
            lastName: deletedDoctor.lastName,
            specialization: deletedDoctor.specialization,
          },
          patient: {
            firstName: patientDetails.firstName,
            lastName: patientDetails.lastName,
            taxId: patientDetails.taxId,
          },
        });
      }
    }
    res
      .status(200)
      .json({ message: "Doctor and future appointments deleted successfully" });
  } catch (err) {
    console.log(err);
    next(errorHandler(500, "Internal Server Error: " + err.message));
  }
};

const approveLeaveRequest = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const leaveRequestId = req.params.leaveRequestId;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const leaveRequest = doctor.leaveRequests.id(leaveRequestId);

    if (!leaveRequest) {
      throw new Error("Leave request not found");
    }

    if (leaveRequest.isApproved !== null) {
      throw new Error("Leave request has already been processed");
    }

    leaveRequest.isApproved = true;
    await sendLeaveApprovalEmail(doctor.email, leaveRequest);
    await doctor.save();

    res.status(200).json({ message: "Leave request approved" });
  } catch (error) {
    console.error("Error approving leave request:", error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const declineLeaveRequest = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const leaveRequestId = req.params.leaveRequestId;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const leaveRequest = doctor.leaveRequests.id(leaveRequestId);

    if (!leaveRequest) {
      throw new Error("Leave request not found");
    }

    if (leaveRequest.isApproved !== null) {
      throw new Error("Leave request has already been processed");
    }

    leaveRequest.isApproved = false;
    await sendLeaveDeclinalEmail(doctor.email, leaveRequest);
    await doctor.save();

    res.status(200).json({ message: "Leave request declined" });
  } catch (error) {
    console.error("Error declining leave request:", error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const deleteLeaveRequest = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can delete only your leaves/vacations"));
  }

  try {
    const doctorId = req.params.id;
    const leaveRequestId = req.params.leaveRequestId;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const leaveRequest = doctor.leaveRequests.id(leaveRequestId);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    leaveRequest.deleteOne();
    await doctor.save();

    const { password: userPassword, ...rest } = doctor._doc;

    res
      .status(200)
      .json({ user: rest, message: "Leave request successfully deleted" });
  } catch (err) {
    console.error("Error deleting leave request:", err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

module.exports = {
  deleteLeaveRequest,
  declineLeaveRequest,
  approveLeaveRequest,
  deleteDoctor,
  updateDoctor,
  getDoctorById,
  getDoctorProfile,
  getDoctorWeeklyAvailability,
  getDoctorAvailabilityForSpecificDate,
  getAllDoctors,
  createDoctor,
};
