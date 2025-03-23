import { Client, Message, PartialMessage, PresenceStatusData, TextChannel } from "discord.js-selfbot-v13"
import { isDirectMessage, isEmptyMessage, isSystemMessage, isVisibleOnlyByClient, isPublishedMessage, extractMessage } from "./utils";
import { Mirror, MirrorConfig } from "./mirror";
import { Config } from "./config"
import { createSocialMedia } from "../mongodb/social-media/social-media.dao";

type ChannelId = string;

export class MirrorClient extends Client {
   private config: Config;
   private mirrorChannels: Map<ChannelId, Mirror> = new Map();

   public constructor(config: Config) {
      super();
      this.config = config;
      this.loadMirrors();

      this.on("ready", () => this.onReady());
      this.on("messageCreate", message => this.onMessageCreate(message));
      this.on("messageUpdate", (oldMessage, newMessage) => this.onMessageUpdate(oldMessage, newMessage));
   }

   private onReady(): void {
      this.user!.setStatus(this.config.getStatus() as PresenceStatusData);
      console.log(`${this.user?.username} is now mirroring >:)!`);
   }

   private onMessageCreate(message: Message): void {
      this.mirrorMessage(message);
   }

   private onMessageUpdate(_oldMessage: Message | PartialMessage, newMessage: any): void {
      if (!newMessage.partial) {
         this.mirrorMessage(newMessage, true);
      }
   }

   private mirrorMessage(message: Message, isUpdate: boolean = false): void {
      if (!this.isMirrorableMessage(message)) {
         return;
      }
      const mirror = this.mirrorChannels.get(message.channelId);
      if (!mirror) {
         return;
      }
      if (!mirror.shouldMirror(message, isUpdate)) {
         return;
      }
      try {
         mirror.applyReplacements(message);
         if(message?.embeds[0]?.description){
           const extractedMessage : any = extractMessage(message?.embeds[0]?.fields, message?.embeds[0]?.description)
           createSocialMedia(extractedMessage.url, extractedMessage, "twitter")
         }
      } catch (error) {
         console.log(error);
      }
      mirror.dispatchMessage(message, () => this.logMirroredMessage(message));  
   }

   private isMirrorableMessage(message: Message): boolean {
      return (
         !isSystemMessage(message) && !isDirectMessage(message) &&
         !isVisibleOnlyByClient(message) && !isEmptyMessage(message) &&
         !isPublishedMessage(message)
      );
   }

   private logMirroredMessage(message: Message): void {
      const logMessage = this.config.getLogMessage();
      if (!logMessage.length) {
         return;
      }
      console.log(logMessage
         .replace("%date%", new Date().toLocaleString())
         .replace("%author%", message?.author?.username ?? "unknown")
         .replace("%server%", message.guild!.name)
         .replace("%channel%", (message.channel as TextChannel).name)
      );
   }

   private loadMirrors(): void {
      for (const mirrorConfig of this.config.getMirrors()) {
         this.loadMirror(mirrorConfig);
      }
   }

   private loadMirror(mirrorConfig: MirrorConfig): void {
      const channelIds = mirrorConfig.channelIds;
      if (!channelIds) {
         return;
      }
      const mirror = new Mirror(mirrorConfig);
      for (const channelId of channelIds) {
         this.mirrorChannels.set(channelId, mirror);
      }
   }
}