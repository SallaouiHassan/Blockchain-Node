import { GuildMember, Message, MessageFlags } from "discord.js-selfbot-v13";

export function memberHasRole(member: GuildMember, ...roleId: string[]): boolean {
   return member.roles.cache.hasAny(...roleId);
}

export function isPublishedMessage(message: Message): boolean {
   return message.flags.has(MessageFlags.FLAGS.CROSSPOSTED);
}

export function isSystemMessage(message: Message): boolean {
   return message.system;
}

export function isDirectMessage(message: Message): boolean {
   return !message.guild;
}

export function isVisibleOnlyByClient(message: Message): boolean {
   return message.flags.has(MessageFlags.FLAGS.EPHEMERAL);
}

export function isEmptyMessage(message: Message): boolean {
   return message.content.length == 0 && message.embeds.length == 0 && message.attachments.size == 0;
}

export function isGif(message: Message): boolean {
   return message.embeds.length == 1 && message.embeds.at(0)?.provider != null;
}

export function containsOnlyAttachments(message: Message): boolean {
   return message.attachments.size > 0 && !message.content.length && !message.embeds.length;
}

export function isString(value: any): boolean {
   return typeof value === "string";
}

export function isValidHexColor(color: string): boolean {
   return /^#[0-9A-F]{6}$/i.test(color);
}

export function hexColorsAreEqual(hexColorA: string, hexColorB: string, epsilon: number = 3000) {
   const colorA = parseInt(hexColorA.slice(1));
   const colorB = parseInt(hexColorB.slice(1));
   return Math.abs(colorA - colorB) <= epsilon;
}

export function extractMessage(profileData, description) {
   const mapper = { 'tweets': 'postsNbr', 'followers': 'followingNbr', 'created': 'accountCreation' }
   const exractData: any = {}
   const regex = />(.*)/;
   const twitterRegex = /\[(.*?)\]\((.*?)\)/;
   const twiiterMatch = description.match(twitterRegex);
   if (twiiterMatch && twiiterMatch.length > 2) {
      // Extract the Twitter username and the text after .com/
      const twitterUserId = twiiterMatch[1];
      const twitterUrl = twiiterMatch[2];
      exractData["id"] = twitterUserId;
      exractData["url"] = twitterUrl;
   } else {
      console.log("No Twitter URL found in the given string.", description);
   }
   profileData.forEach((profile) => {
      const match = profile.value.match(regex);
      if (match && match.length > 1) {
         const textAfterGreaterThan = match[1].trim();
         profile.name.toLocaleLowerCase() == "created" ? (exractData[mapper[profile.name.toLocaleLowerCase()]] = convertTheDiscordDate(textAfterGreaterThan)) :
         (exractData[mapper[profile.name.toLocaleLowerCase()]] = textAfterGreaterThan);
      } else {
         console.log(`No text found after '>' in: ${profile.value}`);
      }
   });
   console.log("exractData", exractData);
   return exractData
}

function convertTheDiscordDate(date) {
   const regex = /<t:(\d+):R>/;
   const match = date.match(regex);
   if (match) {
      const timestamp = parseInt(match[1]);
      const timestampInMilliseconds = timestamp * 1000;
      const date = new Date(timestampInMilliseconds);
      return date
   } else {
      console.log("No Discord timestamp found in the string.");
      return null
   }
}