# -*- encoding: utf-8 -*-
# stub: pact-mock_service 3.11.2 ruby lib

Gem::Specification.new do |s|
  s.name = "pact-mock_service".freeze
  s.version = "3.11.2".freeze

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["James Fraser".freeze, "Sergei Matheson".freeze, "Brent Snook".freeze, "Ronald Holshausen".freeze, "Beth Skurrie".freeze]
  s.date = "2023-05-18"
  s.email = ["james.fraser@alumni.swinburne.edu".freeze, "sergei.matheson@gmail.com".freeze, "brent@fuglylogic.com".freeze, "uglyog@gmail.com".freeze, "beth@bethesque.com".freeze]
  s.executables = ["pact-mock-service".freeze, "pact-stub-service".freeze]
  s.files = ["bin/pact-mock-service".freeze, "bin/pact-stub-service".freeze]
  s.homepage = "https://github.com/bethesque/pact-mock_service".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.0".freeze)
  s.rubygems_version = "3.4.13".freeze
  s.summary = "Provides a mock service for use with Pact".freeze

  s.installed_by_version = "3.5.11".freeze if s.respond_to? :installed_by_version

  s.specification_version = 4

  s.add_runtime_dependency(%q<rack>.freeze, ["~> 2.0".freeze])
  s.add_runtime_dependency(%q<rspec>.freeze, [">= 2.14".freeze])
  s.add_runtime_dependency(%q<find_a_port>.freeze, ["~> 1.0.1".freeze])
  s.add_runtime_dependency(%q<thor>.freeze, [">= 0.19".freeze, "< 2.0".freeze])
  s.add_runtime_dependency(%q<json>.freeze, [">= 0".freeze])
  s.add_runtime_dependency(%q<webrick>.freeze, ["~> 1.8".freeze])
  s.add_runtime_dependency(%q<pact-support>.freeze, ["~> 1.16".freeze, ">= 1.16.4".freeze])
  s.add_development_dependency(%q<rack-test>.freeze, ["~> 0.7".freeze])
  s.add_development_dependency(%q<rake>.freeze, ["~> 13.0".freeze, ">= 13.0.1".freeze])
  s.add_development_dependency(%q<webmock>.freeze, ["~> 3.4".freeze])
  s.add_development_dependency(%q<pry>.freeze, [">= 0".freeze])
  s.add_development_dependency(%q<fakefs>.freeze, ["~> 2.4".freeze])
  s.add_development_dependency(%q<hashie>.freeze, ["~> 2.0".freeze])
  s.add_development_dependency(%q<activesupport>.freeze, ["~> 5.1".freeze])
  s.add_development_dependency(%q<faraday>.freeze, ["~> 0.12".freeze])
  s.add_development_dependency(%q<octokit>.freeze, ["~> 4.7".freeze])
  s.add_development_dependency(%q<conventional-changelog>.freeze, ["~> 1.3".freeze])
  s.add_development_dependency(%q<bump>.freeze, ["~> 0.5".freeze])
end
