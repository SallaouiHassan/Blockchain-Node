import { Message, MessagePayload, WebhookClient, WebhookMessageOptions } from "discord.js-selfbot-v13";
import { containsOnlyAttachments, isGif, memberHasRole } from "./utils";
import { MirrorReplacements, ReplacementConfig } from "./replacements";

interface MirrorConfigRequirements {
   minEmbedsCount?: number;
   minContentLength?: number;
   minAttachmentsCount?: number;
}

interface MirrorConfigOptions {
   useWebhookProfile?: boolean;
   removeAttachments?: boolean;
   mirrorMessagesFromBots?: boolean;
   mirrorReplyMessages?: boolean;
   mirrorMessagesOnEdit?: boolean;
}

export interface MirrorConfig {
   channelIds?: string[];
   webhookUrls?: string[];
   ignoredUserIds?: string[];
   ignoredRoleIds?: string[];
   requirements?: MirrorConfigRequirements;
   options?: MirrorConfigOptions;
   replacements?: Record<number, ReplacementConfig>;
}

class MirrorRequirements {
   public minEmbedsCount: number;
   public minContentLength: number;
   public minAttachmentsCount: number;

   public constructor({
      minEmbedsCount = 0,
      minContentLength = 0,
      minAttachmentsCount = 0
   }: MirrorConfigRequirements) {
      this.minEmbedsCount = minEmbedsCount;
      this.minContentLength = minContentLength;
      this.minAttachmentsCount = minAttachmentsCount;
   }
}

class MirrorOptions {
   public useWebhookProfile: boolean;
   public removeAttachments: boolean;
   public mirrorMessagesFromBots: boolean;
   public mirrorReplyMessages: boolean;
   public mirrorMessagesOnEdit: boolean;

   public constructor({
      useWebhookProfile = false,
      removeAttachments = false,
      mirrorMessagesFromBots = true,
      mirrorReplyMessages = true,
      mirrorMessagesOnEdit = false
   }: MirrorConfigOptions) {
      this.useWebhookProfile = useWebhookProfile;
      this.removeAttachments = removeAttachments;
      this.mirrorMessagesFromBots = mirrorMessagesFromBots;
      this.mirrorReplyMessages = mirrorReplyMessages;
      this.mirrorMessagesOnEdit = mirrorMessagesOnEdit;
   }
}

export class Mirror {
   private webhooks: WebhookClient[] = [];
   private ignoredUserIds: Set<string>;
   private ignoredRoleIds: string[];
   private mirrorRequirements: MirrorRequirements;
   private mirrorOptions: MirrorOptions;
   private replacements: MirrorReplacements;

   public constructor({
      webhookUrls = [],
      ignoredUserIds = undefined,
      ignoredRoleIds = [],
      requirements = {},
      options = {},
      replacements = {}
   }: MirrorConfig) {
      this.loadWebhooks(webhookUrls);
      this.ignoredUserIds = new Set(ignoredUserIds);
      this.ignoredRoleIds = ignoredRoleIds;
      this.mirrorRequirements = new MirrorRequirements(requirements);
      this.mirrorOptions = new MirrorOptions(options);
      this.replacements = new MirrorReplacements(replacements);
   }

   public shouldMirror(message: Message, isUpdate: boolean): boolean {
      return (
         this.messageMeetsOptions(message, isUpdate) &&
         this.messageMeetsRequirements(message) && 
         this.stripMessage(message)
      );
   }

   public applyReplacements(message: Message): void {
      this.replacements.apply(message);
   }

   public dispatchMessage(message: Message, callback: (message: Message) => void): void {
      const payloads = this.createMessagePayloads(message);
      
      for (const webhook of this.webhooks) {
         for (const payload of payloads) {
            webhook
               .send(payload)
               .then(() => callback(message))
               .catch(error => console.log(error));
         }
      }
   }

   private createMessagePayloads(message: Message): (MessagePayload | WebhookMessageOptions)[] {
      const maxContentLength = 2000;

      const payloads: (MessagePayload | WebhookMessageOptions)[] = [];
      const payload: MessagePayload | WebhookMessageOptions = {
         content: message.content.length ? message.content.substring(0, maxContentLength) : undefined,
         files: [...message.attachments.values()],
         embeds: message.embeds
      };
      if (!this.mirrorOptions.useWebhookProfile) {
         payload.username = message.author.username;
         payload.avatarURL = message.author?.avatarURL() ?? undefined;
      }
      payloads.push(payload);

      for (let i = 0; i < Math.floor(message.content.length / (maxContentLength + 1)); i++) {
         const payload: MessagePayload | WebhookMessageOptions = {
            content: message.content.substring((i + 1) * maxContentLength, (i + 2) * maxContentLength)
         }
         if (!this.mirrorOptions.useWebhookProfile) {
            payload.username = message.author.username;
            payload.avatarURL = message.author.avatarURL() ?? undefined;
         }
         payloads.push(payload);
      }
      return payloads;
   }

   private messageMeetsOptions(message: Message, isUpdate: boolean): boolean {
      return (
         (this.mirrorOptions.mirrorMessagesFromBots || !message.author.bot) &&
         (this.mirrorOptions.mirrorReplyMessages || !message.reference) &&
         (this.mirrorOptions.mirrorMessagesOnEdit || !isUpdate)
      );
   }

   private messageMeetsRequirements(message: Message): boolean {
      return (
         message.content.length >= this.mirrorRequirements.minContentLength &&
         message.embeds.length >= this.mirrorRequirements.minEmbedsCount &&
         message.attachments.size >= this.mirrorRequirements.minAttachmentsCount &&
         !(message.author.id in this.ignoredUserIds) &&
         (message.member == null || !memberHasRole(message.member, ...this.ignoredRoleIds))
      );
   }

   private stripMessage(message: Message): boolean {
      if (this.mirrorOptions.removeAttachments) {
         if (containsOnlyAttachments(message)) {
            return false;
         }
         message.attachments.clear();
      }
      if (isGif(message)) {
         message.embeds.pop();
      }
      return true;
   }

   private loadWebhooks(webhookUrls: string[]): void {
      for (const webhookUrl of webhookUrls) {
         this.webhooks.push(new WebhookClient({ url: webhookUrl }));
      }
   }
}