require 'securerandom'
require 'digest'
require 'socket'
require 'pact/mock_service/version'
require 'net/http'

module Pact
  module Support
    class Metrics

      def self.report_metric(event, category, action, value = 1)
        do_once_per_thread(:pact_metrics_message_shown) do
          if track_events?
            Pact.configuration.output_stream.puts "mock WARN: Please note: we are tracking events anonymously to gather important usage statistics like Pact-Ruby version and operating system. To disable tracking, set the 'PACT_DO_NOT_TRACK' environment variable to 'true'."
          end
        end

        in_thread do
          begin
            if track_events?
              uri = URI('https://www.google-analytics.com/collect')
              req = Net::HTTP::Post.new(uri)
              req.set_form_data(create_tracking_event(event, category, action, value))

              Net::HTTP.start(uri.hostname, uri.port, read_timeout:2, open_timeout:2, :use_ssl => true  ) do |http|
                http.request(req)
              end
            end
          rescue StandardError => e
            handle_error(e)
          end
        end
      end

      private

      def self.handle_error e
        if ENV['PACT_METRICS_DEBUG'] == 'true'
          Pact.configuration.output_stream.puts("DEBUG: #{e.inspect}\n" + e.backtrace.join("\n"))
        end
      end

      def self.in_thread
        Thread.new do
          yield
        end
      end

      # Not super safe to use the thread, but it's good enough for this usecase
      def self.do_once_per_thread(key)
        result = nil
        if !Thread.current[key]
          result = yield
        end
        Thread.current[key] = true
        result
      end

      def self.create_tracking_event(event, category, action, value)
        {
          "v" => 1,
          "t" => "event",
          "tid" => "UA-117778936-1",
          "cid" => calculate_cid,
          "an" => "Pact Mock Service",
          "av" => Pact::MockService::VERSION,
          "aid" => "pact-mock_service",
          "aip" => 1,
          "ds" => ENV['PACT_EXECUTING_LANGUAGE'] ? "client" : "cli",
          "cd2" => ENV['CI'] == "true" ? "CI" : "unknown",
          "cd3" => RUBY_PLATFORM,
          "cd6" => ENV['PACT_EXECUTING_LANGUAGE'] || "unknown",
          "cd7" => ENV['PACT_EXECUTING_LANGUAGE_VERSION'],
          "el" => event,
          "ec" => category,
          "ea" => action,
          "ev" => value
        }
      end

      def self.track_events?
        ENV['PACT_DO_NOT_TRACK'] != 'true'
      end

      def self.calculate_cid
        if RUBY_PLATFORM.include? "windows"
          hostname = ENV['COMPUTERNAME']
        else
          hostname = ENV['HOSTNAME']
        end
        if !hostname
          hostname = Socket.gethostname
        end
        Digest::MD5.hexdigest hostname || SecureRandom.urlsafe_base64(5)
      end
    end
  end
end
