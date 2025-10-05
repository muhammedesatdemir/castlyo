import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Database } from '@castlyo/database';
import { agencyProfiles, jobPosts, jobApplications, talentProfiles } from '@castlyo/database';
import { eq, desc, sql } from 'drizzle-orm';

@Injectable()
export class ApplicationsService {
  constructor(@Inject('DRIZZLE') private readonly db: Database) {}

  private async assertJobBelongsToAgencyUser(jobId: string, userId: string) {
    const agency = await this.db
      .select({ id: agencyProfiles.id, userId: agencyProfiles.userId })
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    if (!agency.length) throw new ForbiddenException('Ajans profili bulunamadı');

    const job = await this.db
      .select({ id: jobPosts.id, agencyId: jobPosts.agencyId })
      .from(jobPosts)
      .where(eq(jobPosts.id, jobId))
      .limit(1);

    if (!job.length) throw new NotFoundException('İlan bulunamadı');
    if (job[0].agencyId !== agency[0].id) throw new ForbiddenException();

    return { agencyId: agency[0].id };
  }

  async listForJobAsAgency(jobId: string, userId: string) {
    await this.assertJobBelongsToAgencyUser(jobId, userId);

    const rows = await this.db.execute(sql`
      SELECT 
        ja.id  AS "applicationId",
        ja.applicant_user_id AS "applicantUserId",
        ja.talent_id AS "talentId",
        COALESCE(
          NULLIF(TRIM(CONCAT(tp.first_name,' ',tp.last_name)),''),
          NULLIF(TRIM(CONCAT(u.first_name,' ',u.last_name)),''),
          u.email,
          'İsimsiz Başvuru'
        ) AS "fullName",
        (tp.id IS NOT NULL) AS "hasTalentProfile",
        ja.created_at AS "createdAt"
      FROM job_applications ja
      LEFT JOIN talent_profiles tp ON tp.id = ja.talent_id
      LEFT JOIN users u ON u.id = ja.applicant_user_id
      WHERE ja.job_id = ${jobId}
      ORDER BY ja.created_at DESC
      LIMIT 200
    `);

    return { data: rows };
  }

  async detailsForJobAsAgency(jobId: string, applicationId: string, userId: string) {
    await this.assertJobBelongsToAgencyUser(jobId, userId);

    const rows = await this.db.execute(sql`
      SELECT 
        ja.id AS "applicationId",
        ja.status,
        ja.cover_letter AS "coverLetter",
        ja.reviewed_at AS "reviewedAt",

        -- Başvuran kullanıcının iletişim bilgileri
        u.email AS "applicantEmail",
        u.phone AS "applicantPhone",

        tp.id AS "talentProfileId",
        COALESCE(NULLIF(TRIM(tp.display_name), ''), CONCAT(tp.first_name, ' ', tp.last_name)) AS "displayName",
        tp.first_name, tp.last_name, tp.profile_image,
        tp.city, tp.country, tp.bio, tp.experience,
        tp.birth_date, tp.gender, tp.height_cm, tp.weight_kg,
        tp.skills, tp.languages, tp.specialties,
        tp.resume_url

      FROM job_applications ja

      -- talent_id varsa onu, yoksa user_id ile profili bul
      LEFT JOIN LATERAL (
        SELECT *
        FROM talent_profiles tpp
        WHERE tpp.id = ja.talent_id
           OR (ja.talent_id IS NULL AND tpp.user_id = ja.applicant_user_id)
        ORDER BY (tpp.id = ja.talent_id) DESC
        LIMIT 1
      ) tp ON TRUE

      -- BAŞVURAN KULLANICI (iletişim için)
      LEFT JOIN users u ON u.id = ja.applicant_user_id

      WHERE ja.id = ${applicationId} AND ja.job_id = ${jobId}
      LIMIT 1
    `);

    if (!rows[0]) throw new NotFoundException('Başvuru bulunamadı');
    return { data: rows[0] };
  }
}


