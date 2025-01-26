const Admin = require("../models/admin.model");
const jwt = require("jsonwebtoken");
const Model = require("mongoose");
const error = require("console");
const bcryptjs = require("bcryptjs");
const dotenv = require("dotenv");
const { errorHandler } = require("../utils/error.js");
const { validationResult } = require("express-validator");
const { sendWelcomeEmail } = require("../utils/doctors/doctorWelcomeEmail.js");

// const {
//   generateRandomPassword,
// } = require("../utils/auth/generateRandomPsw.js");
// const Visit = require("../models/visitModel.js");

// const {
//   sendVisitCancellationEmail,
// } = require("../utils/visits/visitCancellationEmail.js");
// const { startOfDay, addDays, addHours } = require("date-fns");
// const moment = require("moment");
// const {
//   sendLeaveApprovalEmail,
//   sendLeaveDeclinalEmail,
//   sendNewLeaveRequestEmailToAdmin,
// } = require("../utils/doctors/leaveManagementEmails.js");
// const {
//   checkDuplicateLeaveRequests,
//   validateLeaveRequests,
// } = require("../utils/doctors/leaveRequests.js");

// Register a new user, with VAT check for admins
const createAdmin = async (req, res, next) => {
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
        message: "An Admin with the same TaxId or email already exists",
      });
    }

    // let workShiftsGMT = [];
    // if (workShifts && workShifts.length > 0) {
    //   workShiftsGMT = workShifts.map((shift) => ({
    //     dayOfWeek: shift.dayOfWeek,
    //     startTime: moment(shift.startTime, "HH:mm").utc().format("HH:mm"),
    //     endTime: moment(shift.endTime, "HH:mm").utc().format("HH:mm"),
    //   }));
    // }

    // const randomPassword = generateRandomPassword();
    const hashedPassword = bcryptjs.hashSync(password, 10);

    const newAdmin = await Admin.create({
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
      // workShifts: workShifts === undefined ? workShifts : workShiftsGMT,
    });
    const token = jwt.sign({ userId: newAdmin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    await sendWelcomeEmail(newAdmin.email, token);

    res.status(201).json({
      message: "Admin created successfully and email sent",
      admin: newAdmin,
    });
  } catch (err) {
    console.error(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getAdminProfile = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can see only your account"));
  }

  const userId = req.user.id;

  try {
    const admin = await Admin.findById(userId);

    if (!admin) {
      return res.status(404).json({ message: "doctor not found." });
    }

    const { password, ...rest } = admin._doc;

    res.status(200).json({ ...rest });
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getAdminById = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (err) {
    console.log(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

// const getDoctorAvailabilityForSpecificDate = async (req, res, next) => {
//   try {
//     const doctor = await Doctor.findById(req.params.id);

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     const visitDate = req.query.visitDate;

//     if (!visitDate) {
//       return res.status(400).json({ message: "Visit date is required" });
//     }

//     const currentDate = new Date();

//     if (new Date(visitDate) < currentDate) {
//       return res
//         .status(400)
//         .json({ message: "Visit date must be in the future" });
//     }

//     const minutes = new Date(visitDate).getMinutes();
//     if (minutes % 60 !== 0) {
//       return res
//         .status(400)
//         .json({ message: "Visit must be scheduled in one-hour intervals" });
//     }

//     const isAvailable = await doctor.isAvailable(new Date(visitDate));
//     const hasExistingVisits = await doctor.checkExistingVisits(
//       new Date(visitDate)
//     );

//     res.json({ isAvailable, hasExistingVisits });
//   } catch (error) {
//     console.error("Error getting doctor availability:", error);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

// const getDoctorWeeklyAvailability = async (req, res, next) => {
//   try {
//     const doctor = await Doctor.findById(req.params.id);

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     const currentDateMoment = moment().utc().startOf("day").add(1, "days");
//     const endDateMoment = currentDateMoment.clone().add(6, "days");

//     let currentDate = currentDateMoment.toDate();
//     const endDate = endDateMoment.toDate();

//     const availableSlots = [];

//     while (currentDate <= endDate) {
//       const dayOfWeek = currentDate.toLocaleDateString("en-US", {
//         weekday: "long",
//       });
//       const workShift = doctor.workShifts.find(
//         (shift) => shift.dayOfWeek === dayOfWeek
//       );

//       if (workShift) {
//         let startTime = addHours(
//           currentDate,
//           parseInt(workShift.startTime.split(":")[0])
//         );
//         const endTime = addHours(
//           currentDate,
//           parseInt(workShift.endTime.split(":")[0])
//         );
//         while (startTime < endTime) {
//           const isAvailable = await doctor.isAvailable(startTime);
//           const hasExistingVisits = await doctor.checkExistingVisits(startTime);

//           if (isAvailable && !hasExistingVisits) {
//             availableSlots.push(startTime);
//           }

//           startTime = addHours(startTime, 1);
//         }
//       }

//       currentDate = addDays(currentDate, 1);
//     }

//     res.json(availableSlots);
//   } catch (error) {
//     console.error("Error getting doctor availability:", error);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

const updateAdmin = async (req, res, next) => {
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
      const existingTaxId = await Admin.findOne({
        taxId,
        _id: { $ne: req.params.id },
      });
      if (existingTaxId)
        return res.status(409).json({ message: "TaxId already exists" });
      updateFields.taxId = taxId;
    }

    if (email) {
      const existingEmail = await Admin.findOne({
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
      const existingAdmin = await Admin.findById(req.params.id);
      const existingLeaveRequests = await Admin.findById(req.params.id).select(
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
        existingAdmin.leaveRequests.concat(leaveRequests);

      for (const request of leaveRequests) {
        request.adminName = `${existingAdmin.firstName} ${existingAdmin.lastName}`;
        request.adminEmail = existingAdmin.email;
        await sendNewLeaveRequestEmailToAdmin(request);
      }
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedAdmin) {
      return next(errorHandler(404, "Doctor not found"));
    }

    const { password: userPassword, ...rest } = updatedAdmin._doc;

    res.status(200).json({ user: rest });
  } catch (err) {
    console.log(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const { id: adminId } = req.params;
    const { id: authUserId, role } = req.user;

    const adminToDelete = await Admin.findById(adminId);

    if (!adminToDelete) {
      return next(errorHandler(404, "Doctor not found"));
    }

    if (authUserId !== adminToDelete.id && role !== "admin") {
      return next(
        errorHandler(
          403,
          "Permission denied. You can only delete your own profile, an admin can delete any profile."
        )
      );
    }

    // const currentDate = new Date();

    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Delete future appointments
    // const deletionResult = await Visit.deleteMany({
    //   doctor: doctorId,
    //   date: { $gte: currentDate },
    // });

    // // If any appointments are deleted, send cancellation emails to the affected patients
    // if (deletionResult.deletedCount > 0) {
    //   const futureVisits = await Visit.find({
    //     doctor: doctorId,
    //     date: { $gte: currentDate },
    //   });

    //   // for (const deletedVisit of futureVisits) {
    //   //   const patientDetails = await Admin.findById(deletedVisit.user);
    //   //   const userEmail = patientDetails.email;

    //     // Send visit cancellation email
    //     await sendVisitCancellationEmail(userEmail, deletedDoctor.email, {
    //       date: deletedVisit.date,
    //       doctor: {
    //         firstName: deletedDoctor.firstName,
    //         lastName: deletedDoctor.lastName,
    //         specialization: deletedDoctor.specialization,
    //       },
    //       patient: {
    //         firstName: patientDetails.firstName,
    //         lastName: patientDetails.lastName,
    //         taxId: patientDetails.taxId,
    //       },
    //     });
    res
      .status(200)
      .json({ message: "Admin and future appointments deleted successfully" });
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

// const approveLeaveRequest = async (req, res, next) => {
//   try {
//     const doctorId = req.params.id;
//     const leaveRequestId = req.params.leaveRequestId;

//     const doctor = await Doctor.findById(doctorId);

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     const leaveRequest = doctor.leaveRequests.id(leaveRequestId);

//     if (!leaveRequest) {
//       throw new Error("Leave request not found");
//     }

//     if (leaveRequest.isApproved !== null) {
//       throw new Error("Leave request has already been processed");
//     }

//     leaveRequest.isApproved = true;
//     await sendLeaveApprovalEmail(doctor.email, leaveRequest);
//     await doctor.save();

//     res.status(200).json({ message: "Leave request approved" });
//   } catch (error) {
//     console.error("Error approving leave request:", error);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

// const declineLeaveRequest = async (req, res, next) => {
//   try {
//     const doctorId = req.params.id;
//     const leaveRequestId = req.params.leaveRequestId;

//     const doctor = await Doctor.findById(doctorId);

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     const leaveRequest = doctor.leaveRequests.id(leaveRequestId);

//     if (!leaveRequest) {
//       throw new Error("Leave request not found");
//     }

//     if (leaveRequest.isApproved !== null) {
//       throw new Error("Leave request has already been processed");
//     }

//     leaveRequest.isApproved = false;
//     await sendLeaveDeclinalEmail(doctor.email, leaveRequest);
//     await doctor.save();

//     res.status(200).json({ message: "Leave request declined" });
//   } catch (error) {
//     console.error("Error declining leave request:", error);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

// const deleteLeaveRequest = async (req, res, next) => {
//   if (req.user.id !== req.params.id) {
//     return next(errorHandler(401, "You can delete only your leaves/vacations"));
//   }

//   try {
//     const doctorId = req.params.id;
//     const leaveRequestId = req.params.leaveRequestId;

//     const doctor = await Doctor.findById(doctorId);

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     const leaveRequest = doctor.leaveRequests.id(leaveRequestId);

//     if (!leaveRequest) {
//       return res.status(404).json({ message: "Leave request not found" });
//     }

//     leaveRequest.deleteOne();
//     await doctor.save();

//     const { password: userPassword, ...rest } = doctor._doc;

//     res
//       .status(200)
//       .json({ user: rest, message: "Leave request successfully deleted" });
//   } catch (err) {
//     console.error("Error deleting leave request:", err);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

module.exports = {
  // deleteLeaveRequest,
  // declineLeaveRequest,
  // approveLeaveRequest,
  deleteAdmin,
  updateAdmin,
  getAdminById,
  getAdminProfile,
  // getDoctorWeeklyAvailability,
  // getDoctorAvailabilityForSpecificDate,
  getAllAdmins,
  createAdmin,
};
