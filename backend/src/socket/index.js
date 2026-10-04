import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

/*
 * Realtime layer for Split.ly.
 *
 * Rooms:
 *   user:<userId>    — every socket belonging to a given user (used to push that
 *                       user's socket into/out of a group room the moment they
 *                       join/leave it via REST, without waiting for a reconnect)
 *   group:<groupId>  — every connected member of that group. All group activity
 *                       (expenses, settlements, membership changes) is broadcast here.
 *
 * A single event, "group:activity", carries every kind of update. The client
 * decides what to do with it: the open GroupDetail page refetches in place,
 * while the sidebar / groups list use it to bump an unread counter.
 */

let io = null;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true,
        },
    });

    // Authenticate the handshake with the same access token used for REST calls.
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.split(" ")[1];

            if (!token) return next(new Error("Unauthorized"));

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select("_id groups");
            if (!user) return next(new Error("Unauthorized"));

            socket.userId = user._id.toString();
            socket.userGroups = (user.groups || []).map((g) => g.toString());
            next();
        } catch (error) {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(`user:${socket.userId}`);
        socket.userGroups.forEach((groupId) => socket.join(`group:${groupId}`));

        // Lets a client explicitly (re)join/leave a room, e.g. right after joining
        // a group in the same session without reconnecting the socket.
        socket.on("group:join", (groupId) => {
            if (groupId) socket.join(`group:${groupId}`);
        });
        socket.on("group:leave", (groupId) => {
            if (groupId) socket.leave(`group:${groupId}`);
        });
    });

    return io;
}

export function getIO() {
    return io;
}

/** Push every socket belonging to `userId` into `group:<groupId>` (e.g. right after they join). */
export function joinUserToGroup(userId, groupId) {
    if (!io || !userId || !groupId) return;
    io.in(`user:${userId}`).socketsJoin(`group:${groupId}`);
}

/** Remove every socket belonging to `userId` from `group:<groupId>` (e.g. right after they leave). */
export function leaveUserFromGroup(userId, groupId) {
    if (!io || !userId || !groupId) return;
    io.in(`user:${userId}`).socketsLeave(`group:${groupId}`);
}

/**
 * Broadcast a group-activity event to everyone currently connected to that group's room.
 * `type` drives both the live-page refetch and the unread-badge logic on the client, e.g.
 * 'expense_added' | 'expense_deleted' | 'expense_settled' |
 * 'settlement_initiated' | 'settlement_confirmed' | 'settlement_cancelled' |
 * 'member_joined' | 'member_left'
 */
export function emitToGroup(groupId, type, data = {}) {
    if (!io || !groupId) return;
    io.to(`group:${groupId}`).emit("group:activity", {
        groupId: groupId.toString(),
        type,
        at: Date.now(),
        ...data,
    });
}