import { Socket } from 'socket.io-client';
import logger from '@/lib/logger';

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: Socket;
  private waId: string;

  constructor(socket: Socket, waId: string) {
    this.socket = socket;
    this.waId = waId;
  }

  async initialize(localVideoElement?: HTMLVideoElement) {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoElement) {
        localVideoElement.srcObject = this.localStream;
      }

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('rtc:ice-candidate', {
            waId: this.waId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        logger.info('Remote stream received');
      };

      // Join RTC room
      this.socket.emit('rtc:join', { waId: this.waId });

      // Listen for signaling events
      this.setupSignalingListeners();

      logger.info('WebRTC initialized');
    } catch (error) {
      logger.error('Error initializing WebRTC', { error });
      throw error;
    }
  }

  private setupSignalingListeners() {
    this.socket.on('rtc:offer', async (offer: RTCSessionDescriptionInit) => {
      if (!this.peerConnection) return;

      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.socket.emit('rtc:answer', {
          waId: this.waId,
          answer,
        });
      } catch (error) {
        logger.error('Error handling offer', { error });
      }
    });

    this.socket.on('rtc:answer', async (answer: RTCSessionDescriptionInit) => {
      if (!this.peerConnection) return;

      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        logger.error('Error handling answer', { error });
      }
    });

    this.socket.on('rtc:ice-candidate', async (candidate: RTCIceCandidateInit) => {
      if (!this.peerConnection) return;

      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        logger.error('Error adding ICE candidate', { error });
      }
    });
  }

  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('rtc:offer', {
        waId: this.waId,
        offer,
      });

      return offer;
    } catch (error) {
      logger.error('Error creating offer', { error });
      throw error;
    }
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    logger.info('WebRTC connection closed');
  }
}

