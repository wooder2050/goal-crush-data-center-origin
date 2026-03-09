import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────
  // Points & Badges (inlined private helpers)
  // ────────────────────────────────────────────

  private async addUserPoints(transaction: {
    user_id: string;
    points_change: number;
    point_type: string;
    reference_id?: number;
    description?: string;
  }): Promise<void> {
    await this.prisma.userPoint.create({
      data: {
        user_id: transaction.user_id,
        points_change: transaction.points_change,
        point_type: transaction.point_type,
        reference_id: transaction.reference_id,
        description: transaction.description,
      },
    });
  }

  private async addPostCreatePoints(userId: string, postId: number): Promise<void> {
    await this.addUserPoints({
      user_id: userId,
      points_change: 10,
      point_type: 'post_create',
      reference_id: postId,
      description: '게시글 작성',
    });
    await this.checkAndAwardBadges(userId);
  }

  private async addCommentCreatePoints(userId: string, commentId: number): Promise<void> {
    await this.addUserPoints({
      user_id: userId,
      points_change: 5,
      point_type: 'comment_create',
      reference_id: commentId,
      description: '댓글 작성',
    });
    await this.checkAndAwardBadges(userId);
  }

  private async addLikeReceivedPoints(userId: string, postId: number): Promise<void> {
    await this.addUserPoints({
      user_id: userId,
      points_change: 2,
      point_type: 'like_received',
      reference_id: postId,
      description: '좋아요 받기',
    });
    await this.checkAndAwardBadges(userId);
  }

  private async addMvpVotePoints(userId: string, voteId: number): Promise<void> {
    await this.addUserPoints({
      user_id: userId,
      points_change: 5,
      point_type: 'mvp_vote',
      reference_id: voteId,
      description: 'MVP 투표',
    });
    await this.checkAndAwardBadges(userId);
  }

  private async checkAndAwardBadges(userId: string): Promise<void> {
    try {
      // 1. 첫 번째 게시글 작성 배지
      const postCount = await this.prisma.communityPost.count({
        where: { user_id: userId, is_deleted: false },
      });

      if (postCount >= 1) {
        const has = await this.prisma.userBadge.findUnique({
          where: { user_id_badge_type: { user_id: userId, badge_type: 'first_post' } },
        });
        if (!has) {
          await this.prisma.userBadge.create({
            data: {
              user_id: userId,
              badge_type: 'first_post',
              badge_name: '첫 번째 게시글',
              badge_description: '커뮤니티에 첫 번째 게시글을 작성했습니다',
              badge_icon: '✍️',
            },
          });
        }
      }

      // 2. 예측 마스터 배지 (MVP 투표 5회 이상)
      const mvpVoteCount = await this.prisma.mvpVote.count({
        where: { user_id: userId },
      });

      if (mvpVoteCount >= 5) {
        const has = await this.prisma.userBadge.findUnique({
          where: { user_id_badge_type: { user_id: userId, badge_type: 'prediction_master' } },
        });
        if (!has) {
          await this.prisma.userBadge.create({
            data: {
              user_id: userId,
              badge_type: 'prediction_master',
              badge_name: '예측 마스터',
              badge_description: '5회 이상 MVP 투표에 참여했습니다',
              badge_icon: '🔮',
            },
          });
        }
      }

      // 3. 팀 서포터 배지 (팀 관련 게시글 3개 이상)
      const teamPostCount = await this.prisma.communityPost.count({
        where: { user_id: userId, is_deleted: false, team_id: { not: null } },
      });

      if (teamPostCount >= 3) {
        const has = await this.prisma.userBadge.findUnique({
          where: { user_id_badge_type: { user_id: userId, badge_type: 'team_supporter' } },
        });
        if (!has) {
          await this.prisma.userBadge.create({
            data: {
              user_id: userId,
              badge_type: 'team_supporter',
              badge_name: '팀 서포터',
              badge_description: '팀 관련 게시글을 3개 이상 작성했습니다',
              badge_icon: '⚽',
            },
          });
        }
      }

      // 4. MVP 투표자 배지 (MVP 투표 1회 이상)
      if (mvpVoteCount >= 1) {
        const has = await this.prisma.userBadge.findUnique({
          where: { user_id_badge_type: { user_id: userId, badge_type: 'mvp_voter' } },
        });
        if (!has) {
          await this.prisma.userBadge.create({
            data: {
              user_id: userId,
              badge_type: 'mvp_voter',
              badge_name: 'MVP 투표자',
              badge_description: 'MVP 투표에 참여했습니다',
              badge_icon: '🗳️',
            },
          });
        }
      }

      // 5. 댓글 왕 배지 (댓글 10개 이상)
      const commentCount = await this.prisma.postComment.count({
        where: { user_id: userId, is_deleted: false },
      });

      if (commentCount >= 10) {
        const has = await this.prisma.userBadge.findUnique({
          where: { user_id_badge_type: { user_id: userId, badge_type: 'comment_king' } },
        });
        if (!has) {
          await this.prisma.userBadge.create({
            data: {
              user_id: userId,
              badge_type: 'comment_king',
              badge_name: '댓글 왕',
              badge_description: '10개 이상의 댓글을 작성했습니다',
              badge_icon: '💬',
            },
          });
        }
      }

      // 6. 좋아요 챔피언 배지 (좋아요 20개 이상 받음)
      const likeCount = await this.prisma.postLike.count({
        where: { post: { user_id: userId, is_deleted: false } },
      });

      if (likeCount >= 20) {
        const has = await this.prisma.userBadge.findUnique({
          where: { user_id_badge_type: { user_id: userId, badge_type: 'like_champion' } },
        });
        if (!has) {
          await this.prisma.userBadge.create({
            data: {
              user_id: userId,
              badge_type: 'like_champion',
              badge_name: '좋아요 챔피언',
              badge_description: '게시글이 20개 이상의 좋아요를 받았습니다',
              badge_icon: '❤️',
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('배지 확인 및 부여 오류:', error);
    }
  }

  // ────────────────────────────────────────────
  // Posts CRUD
  // ────────────────────────────────────────────

  /** GET /community/posts */
  async getPosts(query: {
    page?: number;
    limit?: number;
    category?: string;
    team_id?: string;
    sortBy?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: {
      is_deleted: boolean;
      category?: string;
      team_id?: number;
    } = { is_deleted: false };

    if (query.category && query.category !== 'all') {
      whereClause.category = query.category;
    }
    if (query.team_id) {
      whereClause.team_id = parseInt(query.team_id);
    }

    const orderByClause =
      query.sortBy === 'popular'
        ? [
            { views_count: 'desc' as const },
            { likes_count: 'desc' as const },
            { comments_count: 'desc' as const },
            { created_at: 'desc' as const },
          ]
        : { created_at: 'desc' as const };

    const [posts, totalCount] = await Promise.all([
      this.prisma.communityPost.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
        select: {
          post_id: true,
          title: true,
          content: true,
          category: true,
          team_id: true,
          created_at: true,
          updated_at: true,
          likes_count: true,
          comments_count: true,
          views_count: true,
          user: {
            select: {
              korean_nickname: true,
              profile_image_url: true,
            },
          },
          team: {
            select: { team_name: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
      }),
      this.prisma.communityPost.count({ where: whereClause }),
    ]);

    const transformedPosts = posts.map((post) => ({
      post_id: post.post_id.toString(),
      title: post.title,
      content: post.content,
      category: post.category,
      team_id: post.team_id?.toString(),
      team_name: post.team?.team_name,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user_nickname: post.user.korean_nickname,
      user_profile_image: post.user.profile_image_url,
      comment_count: post._count.comments,
      like_count: post._count.likes,
      views_count: post.views_count || 0,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;

    return {
      success: true,
      data: {
        posts: transformedPosts,
        pagination: { currentPage: page, totalPages, totalCount, hasNextPage, limit },
      },
    };
  }

  /** POST /community/posts */
  async createPost(
    userId: string,
    body: { title: string; content: string; category: string; team_id?: string },
  ) {
    const { title, content, category, team_id } = body;

    if (!title || !content || !category) {
      throw new BadRequestException('제목, 내용, 카테고리는 필수입니다.');
    }

    const validCategories = ['general', 'match', 'team', 'data', 'prediction'];
    if (!validCategories.includes(category)) {
      throw new BadRequestException('유효하지 않은 카테고리입니다.');
    }

    const newPost = await this.prisma.communityPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
        team_id: team_id ? parseInt(team_id) : null,
        user_id: userId,
        is_pinned: false,
        is_deleted: false,
      },
    });

    // 게시글 작성 포인트 지급 (+10pt)
    try {
      await this.addPostCreatePoints(userId, newPost.post_id);
    } catch (pointError) {
      this.logger.error('포인트 지급 실패:', pointError);
    }

    const createdPost = await this.prisma.communityPost.findUnique({
      where: { post_id: newPost.post_id },
      include: {
        user: { select: { korean_nickname: true, profile_image_url: true } },
        team: { select: { team_name: true } },
      },
    });

    return {
      success: true,
      data: {
        post_id: createdPost!.post_id,
        title: createdPost!.title,
        content: createdPost!.content,
        category: createdPost!.category,
        team_id: createdPost!.team_id,
        team_name: createdPost!.team?.team_name,
        created_at: createdPost!.created_at.toISOString(),
        updated_at: createdPost!.updated_at.toISOString(),
        user_nickname: createdPost!.user.korean_nickname,
        user_profile_image: createdPost!.user.profile_image_url,
        comment_count: createdPost!.comments_count,
        like_count: createdPost!.likes_count,
      },
      message: '게시글이 성공적으로 작성되었습니다.',
    };
  }

  // ────────────────────────────────────────────
  // Single Post
  // ────────────────────────────────────────────

  /** GET /community/posts/:postId */
  async getPost(postId: number) {
    const post = await this.prisma.communityPost.findUnique({
      where: { post_id: postId, is_deleted: false },
      include: {
        user: { select: { korean_nickname: true, profile_image_url: true } },
        team: { select: { team_name: true } },
        _count: {
          select: {
            comments: { where: { is_deleted: false } },
            likes: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const comments = await this.prisma.postComment.findMany({
      where: { post_id: postId, is_deleted: false },
      include: {
        user: { select: { korean_nickname: true, profile_image_url: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    const postData = {
      post_id: post.post_id,
      title: post.title,
      content: post.content,
      category: post.category,
      team_id: post.team_id,
      team_name: post.team?.team_name,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
      user_nickname: post.user.korean_nickname,
      user_profile_image: post.user.profile_image_url,
      comment_count: post._count.comments,
      like_count: post._count.likes,
      is_liked: false,
    };

    const commentsData = comments.map((comment) => ({
      comment_id: comment.comment_id,
      content: comment.content,
      created_at: comment.created_at.toISOString(),
      user_nickname: comment.user.korean_nickname,
      user_profile_image: comment.user.profile_image_url,
      is_deleted: comment.is_deleted,
    }));

    return { success: true, data: { post: postData, comments: commentsData } };
  }

  // ────────────────────────────────────────────
  // Comments
  // ────────────────────────────────────────────

  /** POST /community/posts/:postId/comments */
  async createComment(
    userId: string,
    postId: number,
    body: { content: string; parent_comment_id?: number },
  ) {
    const { content, parent_comment_id } = body;

    if (!content) {
      throw new BadRequestException('필수 파라미터가 누락되었습니다.');
    }

    const post = await this.prisma.communityPost.findUnique({
      where: { post_id: postId },
      select: { post_id: true, is_deleted: true },
    });

    if (!post || post.is_deleted) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const newComment = await this.prisma.postComment.create({
      data: {
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
        is_deleted: false,
      },
      include: {
        user: { select: { korean_nickname: true, profile_image_url: true } },
      },
    });

    // 게시글의 댓글 수 증가
    await this.prisma.communityPost.update({
      where: { post_id: postId },
      data: { comments_count: { increment: 1 } },
    });

    // 댓글 작성 포인트 지급 (+5pt)
    try {
      await this.addCommentCreatePoints(userId, newComment.comment_id);
    } catch (pointError) {
      this.logger.error('포인트 지급 실패:', pointError);
    }

    return {
      success: true,
      data: {
        comment_id: newComment.comment_id,
        content: newComment.content,
        created_at: newComment.created_at.toISOString(),
        user_nickname: newComment.user.korean_nickname,
        user_profile_image: newComment.user.profile_image_url,
        is_deleted: newComment.is_deleted,
      },
      message: '댓글이 작성되었습니다.',
    };
  }

  // ────────────────────────────────────────────
  // Like (legacy toggle with action param)
  // ────────────────────────────────────────────

  /** POST /community/posts/:postId/like */
  async toggleLikeLegacy(userId: string, postId: number, body: { action: string }) {
    const { action } = body;

    if (!action) {
      throw new BadRequestException('필수 파라미터가 누락되었습니다.');
    }

    const post = await this.prisma.communityPost.findUnique({
      where: { post_id: postId },
      select: { post_id: true, is_deleted: true, user_id: true },
    });

    if (!post || post.is_deleted) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.user_id === userId) {
      throw new BadRequestException('본인이 작성한 게시글에는 좋아요를 할 수 없습니다.');
    }

    if (action === 'like') {
      try {
        await this.prisma.postLike.create({
          data: { post_id: postId, user_id: userId },
        });

        await this.prisma.communityPost.update({
          where: { post_id: postId },
          data: { likes_count: { increment: 1 } },
        });

        // 좋아요 받기 포인트 지급 (+2pt)
        try {
          await this.addLikeReceivedPoints(post.user_id, postId);
        } catch (pointError) {
          this.logger.error('포인트 지급 실패:', pointError);
        }

        return { success: true, data: { liked: true }, message: '좋아요가 추가되었습니다.' };
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code: string }).code === 'P2002'
        ) {
          return {
            success: true,
            data: { liked: true },
            message: '이미 좋아요를 누른 게시글입니다.',
          };
        }
        throw error;
      }
    } else if (action === 'unlike') {
      const deletedLike = await this.prisma.postLike.deleteMany({
        where: { post_id: postId, user_id: userId },
      });

      if (deletedLike.count > 0) {
        await this.prisma.communityPost.update({
          where: { post_id: postId },
          data: { likes_count: { decrement: 1 } },
        });
        return { success: true, data: { liked: false }, message: '좋아요가 취소되었습니다.' };
      } else {
        return {
          success: true,
          data: { liked: false },
          message: '좋아요를 누르지 않은 게시글입니다.',
        };
      }
    } else {
      throw new BadRequestException('유효하지 않은 액션입니다.');
    }
  }

  /** GET /community/posts/:postId/like */
  async getLikeStatus(userId: string, postId: number) {
    const like = await this.prisma.postLike.findUnique({
      where: { post_id_user_id: { post_id: postId, user_id: userId } },
    });
    return { success: true, data: { liked: !!like } };
  }

  // ────────────────────────────────────────────
  // Likes (new toggle endpoint)
  // ────────────────────────────────────────────

  /** POST /community/posts/:postId/likes */
  async toggleLike(userId: string, postId: number) {
    const post = await this.prisma.communityPost.findFirst({
      where: { post_id: postId, is_deleted: false },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const existingLike = await this.prisma.postLike.findUnique({
      where: { post_id_user_id: { post_id: postId, user_id: userId } },
    });

    let isLiked = false;

    if (existingLike) {
      await this.prisma.postLike.delete({
        where: { like_id: existingLike.like_id },
      });
      isLiked = false;
    } else {
      await this.prisma.postLike.create({
        data: { post_id: postId, user_id: userId },
      });
      isLiked = true;

      // 게시글 작성자에게 포인트 지급 (좋아요 받음)
      if (post.user_id !== userId) {
        await this.prisma.userPoint.create({
          data: {
            user_id: post.user_id,
            points_change: 2,
            point_type: 'like_received',
            reference_id: postId,
            description: '게시글 좋아요 받음',
          },
        });

        await this.prisma.userNotification.create({
          data: {
            user_id: post.user_id,
            notification_type: 'like',
            title: '게시글에 좋아요를 받았습니다',
            message: `회원님의 게시글을 좋아합니다.`,
            reference_type: 'post',
            reference_id: postId,
          },
        });
      }
    }

    const updatedPost = await this.prisma.communityPost.findUnique({
      where: { post_id: postId },
      select: { likes_count: true },
    });

    return {
      isLiked,
      likesCount: updatedPost?.likes_count || 0,
      message: isLiked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.',
    };
  }

  /** GET /community/posts/:postId/likes */
  async getLikesStatus(userId: string | null, postId: number) {
    const post = await this.prisma.communityPost.findUnique({
      where: { post_id: postId },
      select: { likes_count: true },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    let isLiked = false;
    if (userId) {
      const userLike = await this.prisma.postLike.findUnique({
        where: { post_id_user_id: { post_id: postId, user_id: userId } },
      });
      isLiked = !!userLike;
    }

    return { isLiked, likesCount: post.likes_count };
  }

  // ────────────────────────────────────────────
  // View tracking
  // ────────────────────────────────────────────

  /** POST /community/posts/:postId/view */
  async trackView(postId: number, userId: string | null, ip: string, userAgent: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { post_id: postId },
      select: { post_id: true, is_deleted: true },
    });

    if (!post || post.is_deleted) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    let sessionId: string;
    if (userId) {
      sessionId = userId;
    } else {
      const sessionData = `${ip}-${userAgent}`;
      sessionId = Buffer.from(sessionData).toString('base64').substring(0, 32);
    }

    // 중복 조회 확인 (24시간 내)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existingView = await this.prisma.postViewRecord.findFirst({
      where: {
        post_id: postId,
        OR: [{ user_id: userId ?? undefined }, { session_id: sessionId }],
        viewed_at: { gte: oneDayAgo },
      },
    });

    if (existingView) {
      return { success: true, message: '이미 조회한 게시글입니다.', isNewView: false };
    }

    await this.prisma.postViewRecord.create({
      data: {
        post_id: postId,
        user_id: userId ?? undefined,
        session_id: sessionId,
        ip_address: ip,
        user_agent: userAgent,
        viewed_at: new Date(),
      },
    });

    await this.prisma.communityPost.update({
      where: { post_id: postId },
      data: { views_count: { increment: 1 } },
    });

    return { success: true, message: '조회가 성공적으로 기록되었습니다.', isNewView: true };
  }

  // ────────────────────────────────────────────
  // Stats
  // ────────────────────────────────────────────

  /** GET /community/stats */
  async getStats() {
    const totalPosts = await this.prisma.communityPost.count({
      where: { is_deleted: false },
    });

    const totalUsers = await this.prisma.user.count({
      where: { is_active: true },
    });

    const totalComments = await this.prisma.postComment.count({
      where: { is_deleted: false },
    });

    const [postLikes, commentLikes] = await Promise.all([
      this.prisma.postLike.count(),
      this.prisma.commentLike.count(),
    ]);
    const totalLikes = postLikes + commentLikes;

    const totalVotes = await this.prisma.mvpVote.count({
      where: { vote_type: 'season' },
    });

    return {
      success: true,
      data: { totalPosts, totalUsers, totalComments, totalLikes, totalVotes },
    };
  }

  /** GET /community/stats/mvp-votes */
  async getStatsMvpVotes(seasonId: number) {
    const voteResults = await this.prisma.mvpVote.groupBy({
      by: ['player_id'],
      where: { season_id: seasonId, vote_type: 'season' },
      _count: { player_id: true },
      orderBy: { _count: { player_id: 'desc' } },
    });

    if (voteResults.length === 0) {
      return { success: true, data: [], message: '해당 시즌에 대한 투표 결과가 없습니다.' };
    }

    const enrichedResults = await Promise.all(
      voteResults.map(async (vote) => {
        const player = await this.prisma.player.findUnique({
          where: { player_id: vote.player_id },
          select: { player_id: true, name: true, profile_image_url: true, jersey_number: true },
        });

        const currentTeam = await this.prisma.playerTeamHistory.findFirst({
          where: { player_id: vote.player_id, season_id: seasonId },
          include: { team: { select: { team_name: true } } },
        });

        const seasonStats = await this.prisma.playerSeasonStats.findFirst({
          where: { player_id: vote.player_id, season_id: seasonId },
          select: { goals: true, assists: true },
        });

        return {
          player_id: vote.player_id,
          player_name: player?.name || 'Unknown',
          team_name: currentTeam?.team?.team_name || null,
          jersey_number: player?.jersey_number || null,
          profile_image_url: player?.profile_image_url || null,
          votes_count: vote._count.player_id,
          goals: seasonStats?.goals || 0,
          assists: seasonStats?.assists || 0,
          mvp_count: 0,
        };
      }),
    );

    return { success: true, data: enrichedResults };
  }

  /** GET /community/stats/today-posts */
  async getTodayPosts() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayPosts = await this.prisma.communityPost.count({
      where: { created_at: { gte: startOfDay, lt: endOfDay }, is_deleted: false },
    });

    return { success: true, data: { todayPosts } };
  }

  /** GET /community/stats/weekly-growth */
  async getWeeklyGrowth() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);

    const [currentWeekPosts, lastWeekPosts] = await Promise.all([
      this.prisma.communityPost.count({
        where: { created_at: { gte: startOfWeek, lt: endOfWeek }, is_deleted: false },
      }),
      this.prisma.communityPost.count({
        where: { created_at: { gte: startOfLastWeek, lt: endOfLastWeek }, is_deleted: false },
      }),
    ]);

    let weeklyGrowth = 0;
    if (lastWeekPosts > 0) {
      weeklyGrowth = ((currentWeekPosts - lastWeekPosts) / lastWeekPosts) * 100;
    } else if (currentWeekPosts > 0) {
      weeklyGrowth = 100;
    }

    return {
      success: true,
      data: {
        weeklyGrowth: Math.round(weeklyGrowth * 10) / 10,
        currentWeekPosts,
        lastWeekPosts,
      },
    };
  }

  // ────────────────────────────────────────────
  // Hot topics
  // ────────────────────────────────────────────

  /** GET /community/hot-topics */
  async getHotTopics(limit: number) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const hotTopics = await this.prisma.communityPost.findMany({
      where: { is_deleted: false, created_at: { gte: sevenDaysAgo } },
      select: {
        post_id: true,
        title: true,
        category: true,
        likes_count: true,
        comments_count: true,
        views_count: true,
        created_at: true,
        _count: { select: { viewRecords: true } },
      },
      orderBy: [{ views_count: 'desc' }, { likes_count: 'desc' }, { comments_count: 'desc' }],
      take: limit,
    });

    return {
      success: true,
      data: hotTopics.map((topic) => ({
        id: topic.post_id,
        title: topic.title,
        category: topic.category,
        likes_count: topic.likes_count || 0,
        comments_count: topic.comments_count || 0,
        views_count: topic.views_count || 0,
        unique_views: topic._count.viewRecords || 0,
        created_at: topic.created_at,
      })),
    };
  }

  // ────────────────────────────────────────────
  // Activity leaders
  // ────────────────────────────────────────────

  /** GET /community/activity/leaders */
  async getActivityLeaders() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const postLeaders = await this.prisma.communityPost.groupBy({
      by: ['user_id'],
      where: { created_at: { gte: thirtyDaysAgo }, is_deleted: false },
      _count: { post_id: true },
      orderBy: { _count: { post_id: 'desc' } },
      take: 5,
    });

    const commentLeaders = await this.prisma.postComment.groupBy({
      by: ['user_id'],
      where: { created_at: { gte: thirtyDaysAgo }, is_deleted: false },
      _count: { comment_id: true },
      orderBy: { _count: { comment_id: 'desc' } },
      take: 5,
    });

    const postLeadersWithUser = await Promise.all(
      postLeaders.map(async (leader) => {
        const user = await this.prisma.user.findUnique({
          where: { user_id: leader.user_id },
          select: { korean_nickname: true, user_id: true },
        });
        return {
          user_id: leader.user_id,
          nickname: user?.korean_nickname || '알 수 없음',
          post_count: leader._count.post_id,
          activity_type: 'post',
        };
      }),
    );

    const commentLeadersWithUser = await Promise.all(
      commentLeaders.map(async (leader) => {
        const user = await this.prisma.user.findUnique({
          where: { user_id: leader.user_id },
          select: { korean_nickname: true, user_id: true },
        });
        return {
          user_id: leader.user_id,
          nickname: user?.korean_nickname || '알 수 없음',
          comment_count: leader._count.comment_id,
          activity_type: 'comment',
        };
      }),
    );

    const pointLeaders = await this.prisma.userPoint.groupBy({
      by: ['user_id'],
      where: { created_at: { gte: thirtyDaysAgo }, points_change: { gt: 0 } },
      _sum: { points_change: true },
      orderBy: { _sum: { points_change: 'desc' } },
      take: 5,
    });

    const pointLeadersWithUser = await Promise.all(
      pointLeaders.map(async (leader) => {
        const user = await this.prisma.user.findUnique({
          where: { user_id: leader.user_id },
          select: { korean_nickname: true, user_id: true },
        });
        return {
          user_id: leader.user_id,
          nickname: user?.korean_nickname || '알 수 없음',
          points_earned: leader._sum.points_change || 0,
          activity_type: 'points',
        };
      }),
    );

    return {
      success: true,
      data: {
        post_leaders: postLeadersWithUser,
        comment_leaders: commentLeadersWithUser,
        point_leaders: pointLeadersWithUser,
      },
    };
  }

  // ────────────────────────────────────────────
  // Recent badges
  // ────────────────────────────────────────────

  /** GET /community/badges/recent */
  async getRecentBadges() {
    const recentBadges = await this.prisma.userBadge.findMany({
      where: { earned_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: {
        badge_id: true,
        user_id: true,
        badge_type: true,
        badge_name: true,
        badge_description: true,
        badge_icon: true,
        earned_at: true,
        user: { select: { korean_nickname: true, user_id: true } },
      },
      orderBy: { earned_at: 'desc' },
      take: 10,
    });

    const badgeColors: Record<string, string> = {
      first_post: '#059669',
      prediction_master: '#2563EB',
      team_supporter: '#EA580C',
      mvp_voter: '#7C3AED',
      daily_login: '#DC2626',
      comment_king: '#0891B2',
      like_champion: '#DB2777',
    };

    const formattedBadges = recentBadges.map((ub) => ({
      user_badge_id: ub.badge_id,
      earned_at: ub.earned_at,
      user: ub.user,
      badge: {
        badge_name: ub.badge_name,
        badge_description: ub.badge_description,
        badge_icon: ub.badge_icon || '🏆',
        badge_color: badgeColors[ub.badge_type] || '#6B7280',
      },
    }));

    return { success: true, data: formattedBadges };
  }

  // ────────────────────────────────────────────
  // MVP votes
  // ────────────────────────────────────────────

  /** GET /community/mvp-votes */
  async getMvpVotes(query: { season_id?: number; vote_type?: string; limit?: number }) {
    const voteType = query.vote_type || 'season';
    const limit = query.limit || 10;

    let targetSeasonId = query.season_id;
    if (!targetSeasonId) {
      const latestSeason = await this.prisma.season.findFirst({
        orderBy: { year: 'desc' },
        select: { season_id: true },
      });
      targetSeasonId = latestSeason?.season_id;
    }

    if (!targetSeasonId) {
      throw new NotFoundException('시즌을 찾을 수 없습니다.');
    }

    const voteResults = await this.prisma.mvpVote.groupBy({
      by: ['player_id'],
      where: { season_id: targetSeasonId, vote_type: voteType },
      _count: { player_id: true },
      orderBy: { _count: { player_id: 'desc' } },
      take: limit,
    });

    if (voteResults.length === 0) {
      return {
        results: [],
        totalVotes: 0,
        seasonId: targetSeasonId,
        message: '해당 시즌에 대한 투표 결과가 없습니다.',
      };
    }

    const enrichedResults = await Promise.all(
      voteResults.map(async (vote) => {
        const player = await this.prisma.player.findUnique({
          where: { player_id: vote.player_id },
          select: { player_id: true, name: true, profile_image_url: true, jersey_number: true },
        });

        const playerTeam = await this.prisma.playerTeamHistory.findFirst({
          where: { player_id: vote.player_id, season_id: targetSeasonId },
          include: { team: { select: { team_name: true, logo: true } } },
        });

        const seasonStats = await this.prisma.playerSeasonStats.findFirst({
          where: { player_id: vote.player_id, season_id: targetSeasonId },
          select: { goals: true, assists: true },
        });

        return {
          player_id: vote.player_id,
          player_name: player?.name || 'Unknown',
          profile_image_url: player?.profile_image_url,
          jersey_number: player?.jersey_number,
          team_name: playerTeam?.team?.team_name || null,
          team_logo: playerTeam?.team?.logo || null,
          votes_count: vote._count.player_id,
          goals: seasonStats?.goals || 0,
          assists: seasonStats?.assists || 0,
        };
      }),
    );

    const totalVotes = voteResults.reduce((sum, v) => sum + v._count.player_id, 0);

    return {
      results: enrichedResults,
      totalVotes,
      seasonId: targetSeasonId,
      voteType,
      message: 'MVP 투표 결과를 성공적으로 조회했습니다.',
    };
  }

  /** POST /community/mvp-votes */
  async castMvpVote(
    userId: string,
    body: {
      season_id: number;
      player_id: number;
      vote_type?: string;
      match_id?: number;
    },
  ) {
    const { season_id, player_id, match_id } = body;
    const vote_type = body.vote_type || 'season';

    if (!season_id || !player_id) {
      throw new BadRequestException('입력 데이터가 올바르지 않습니다.');
    }

    const validVoteTypes = ['season', 'match', 'monthly'];
    if (!validVoteTypes.includes(vote_type)) {
      throw new BadRequestException('입력 데이터가 올바르지 않습니다.');
    }

    const season = await this.prisma.season.findUnique({
      where: { season_id },
    });
    if (!season) {
      throw new NotFoundException('시즌을 찾을 수 없습니다.');
    }

    const player = await this.prisma.player.findUnique({
      where: { player_id },
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (vote_type === 'match' && match_id) {
      const match = await this.prisma.match.findUnique({
        where: { match_id },
      });
      if (!match) {
        throw new NotFoundException('경기를 찾을 수 없습니다.');
      }
    }

    // 기존 투표 확인 (중복 투표 방지)
    const existingVote = await this.prisma.mvpVote.findFirst({
      where: {
        season_id,
        user_id: userId,
        vote_type,
        match_id: match_id || null,
      },
    });

    if (existingVote) {
      const updatedVote = await this.prisma.mvpVote.update({
        where: { vote_id: existingVote.vote_id },
        data: { player_id },
        include: {
          player: {
            select: { player_id: true, name: true, profile_image_url: true, jersey_number: true },
          },
          season: { select: { season_id: true, season_name: true } },
        },
      });
      return { vote: updatedVote, message: 'MVP 투표가 변경되었습니다.' };
    } else {
      const newVote = await this.prisma.mvpVote.create({
        data: { season_id, user_id: userId, player_id, vote_type, match_id },
        include: {
          player: {
            select: { player_id: true, name: true, profile_image_url: true, jersey_number: true },
          },
          season: { select: { season_id: true, season_name: true } },
        },
      });

      // 포인트 지급 (MVP 투표 참여)
      await this.addMvpVotePoints(userId, newVote.vote_id);

      return { vote: newVote, message: 'MVP 투표가 완료되었습니다.' };
    }
  }

  // ────────────────────────────────────────────
  // MVP voting current
  // ────────────────────────────────────────────

  /** GET /community/mvp-voting/current */
  async getMvpVotingCurrent(userId: string | null) {
    const currentSeason = await this.prisma.season.findFirst({
      orderBy: { year: 'desc' },
      select: { season_id: true, season_name: true },
    });

    if (!currentSeason) {
      return { success: true, data: null, message: '진행 중인 시즌이 없습니다.' };
    }

    const completedMatches = await this.prisma.match.findMany({
      where: { season_id: currentSeason.season_id, status: 'completed' },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
        match_date: true,
      },
      orderBy: { match_date: 'desc' },
    });

    const matchMVPs = await Promise.all(
      completedMatches.map(async (match) => {
        const homeScore = match.home_score || 0;
        const awayScore = match.away_score || 0;

        let winningTeamId: number;
        if (homeScore > awayScore) {
          winningTeamId = match.home_team_id || 0;
        } else if (awayScore > homeScore) {
          winningTeamId = match.away_team_id || 0;
        } else {
          return null;
        }

        if (!winningTeamId) return null;

        const playerStats = await this.prisma.playerMatchStats.findMany({
          where: { match_id: match.match_id, team_id: winningTeamId },
          select: {
            player_id: true,
            goals: true,
            assists: true,
            player: {
              select: { player_id: true, name: true, profile_image_url: true, jersey_number: true },
            },
          },
        });

        const playersWithSeasonStats = await Promise.all(
          playerStats.map(async (ps) => {
            const seasonStats = await this.prisma.playerSeasonStats.findFirst({
              where: { player_id: ps.player_id, season_id: currentSeason.season_id },
              select: { goals: true, assists: true },
            });
            return {
              ...ps,
              season_goals: seasonStats?.goals || 0,
              season_assists: seasonStats?.assists || 0,
            };
          }),
        );

        if (playerStats.length === 0) return null;

        const playersWithStats = playersWithSeasonStats.filter(
          (p) => (p.season_goals || 0) > 0 || (p.season_assists || 0) > 0,
        );

        if (playersWithStats.length === 0) return null;

        const sortedPlayers = playersWithStats.sort((a, b) => {
          if ((a.season_goals || 0) !== (b.season_goals || 0)) {
            return (b.season_goals || 0) - (a.season_goals || 0);
          }
          return (b.season_assists || 0) - (a.season_assists || 0);
        });

        const mvpPlayer = sortedPlayers[0];
        if (!mvpPlayer || !mvpPlayer.player) return null;

        const team = await this.prisma.team.findUnique({
          where: { team_id: winningTeamId },
          select: { team_name: true, logo: true },
        });

        return {
          match_id: match.match_id,
          match_date: match.match_date,
          winning_team: {
            team_id: winningTeamId,
            team_name: team?.team_name,
            logo: team?.logo,
          },
          score: { home: homeScore, away: awayScore },
          mvp: {
            player_id: mvpPlayer.player_id,
            name: mvpPlayer.player.name,
            profile_image_url: mvpPlayer.player.profile_image_url,
            jersey_number: mvpPlayer.player.jersey_number,
            goals: mvpPlayer.season_goals || 0,
            assists: mvpPlayer.season_assists || 0,
          },
        };
      }),
    );

    const validMatchMVPs = matchMVPs.filter((mvp) => mvp !== null);

    let userVotedPlayerId = null;
    if (userId) {
      const userVote = await this.prisma.mvpVote.findFirst({
        where: { user_id: userId, season_id: currentSeason.season_id, vote_type: 'season' },
        select: { player_id: true },
      });
      userVotedPlayerId = userVote?.player_id || null;
    }

    return {
      success: true,
      data: {
        season_id: currentSeason.season_id,
        season_name: currentSeason.season_name,
        match_mvps: validMatchMVPs,
        total_matches: validMatchMVPs.length,
        user_voted_player_id: userVotedPlayerId,
        message: '최신 리그 경기 MVP 선수들을 성공적으로 조회했습니다.',
      },
    };
  }

  // ────────────────────────────────────────────
  // Team communities
  // ────────────────────────────────────────────

  /** GET /community/team-communities */
  async getTeamCommunities(limit: number) {
    const teams = await this.prisma.team.findMany({
      select: { team_id: true, team_name: true, logo: true },
      take: limit,
    });

    const teamCommunities = await Promise.all(
      teams.map(async (team) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentPostsCount = await this.prisma.communityPost.count({
          where: { team_id: team.team_id, is_deleted: false, created_at: { gte: thirtyDaysAgo } },
        });

        const totalMembers = await this.prisma.communityPost
          .findMany({
            where: { team_id: team.team_id, is_deleted: false },
            select: { user_id: true },
            distinct: ['user_id'],
          })
          .then((posts) => posts.length);

        const latestPost = await this.prisma.communityPost.findFirst({
          where: { team_id: team.team_id, is_deleted: false },
          select: {
            title: true,
            created_at: true,
            user: { select: { korean_nickname: true } },
          },
          orderBy: { created_at: 'desc' },
        });

        return {
          team_id: team.team_id,
          team_name: team.team_name,
          logo: team.logo,
          recent_posts_count: recentPostsCount,
          total_members: totalMembers,
          latest_post: latestPost
            ? {
                title: latestPost.title,
                created_at: latestPost.created_at,
                user_nickname: latestPost.user.korean_nickname,
              }
            : null,
        };
      }),
    );

    teamCommunities.sort((a, b) => b.recent_posts_count - a.recent_posts_count);

    return { success: true, data: teamCommunities };
  }

  /** GET /community/team-communities/:teamId */
  async getTeamCommunity(teamId: number) {
    const team = await this.prisma.team.findUnique({
      where: { team_id: teamId },
      select: { team_id: true, team_name: true, logo: true },
    });

    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPostsCount = await this.prisma.communityPost.count({
      where: { team_id: teamId, created_at: { gte: thirtyDaysAgo } },
    });

    const totalMembers = await this.prisma.communityPost.groupBy({
      by: ['user_id'],
      where: { team_id: teamId },
      _count: { user_id: true },
    });

    const latestPost = await this.prisma.communityPost.findFirst({
      where: { team_id: teamId },
      orderBy: { created_at: 'desc' },
      select: {
        post_id: true,
        title: true,
        content: true,
        created_at: true,
        user: { select: { korean_nickname: true } },
      },
    });

    const teamCommunity = {
      team_id: team.team_id.toString(),
      team_name: team.team_name,
      logo: team.logo,
      recent_posts_count: recentPostsCount,
      total_members: totalMembers.length,
      latest_post: latestPost
        ? {
            id: latestPost.post_id.toString(),
            title: latestPost.title,
            content: latestPost.content,
            created_at: latestPost.created_at,
            user_nickname: latestPost.user.korean_nickname,
          }
        : null,
    };

    return { data: teamCommunity };
  }
}
